import { MetafieldOwnerType } from "clever_tools/src/types/graphql/2024-04"
import { createCartTransform, getCurrentAppInstallationWithMetafield, metafieldDefinitionUpsert, setMetafields, variantDelete } from "./helpers.server"
import { AdminApiContext } from "@shopify/shopify-app-remix/server"
import logger from "./logger.server"
import { ShopifyAPI } from "clever_tools"

const DEPOSIT_VARIANTS = [
  {
    name: "Einwegflaschen",
    price: 0.25,
  }, 
  {
    name: "Einwegdosen",
    price: 0.25
  }, 
  {
    name: "Mehrwegbierflasche",
    price: 0.08
  }, 
  {
    name: "Mehrwegbierflasche mit Bügelverschluss",
    price: 0.15
  }, 
  {
    name: "Mehrwegwasserflasche (Glas oder PET)",
    price: 0.15
  }, 
  {
    name: "Mehrwegflasche für Saft und Softdrinks",
    price: 0.15
  }, 
  {
    name: "Einwegkunststoffflasche für Milcherzeugnisse",
    price: 0.25
  }, 
]
.map(variant => ({
  ...variant,
  title: `${variant.name} | ${variant.price * 100}ct`
}))

export const install = async (admin: AdminApiContext) => {
  // Todo: fix deposit product image
  // Todo: create example product

  logger.info(`Creating metafield definitions...`)

  const currentAppInstallation = await getCurrentAppInstallationWithMetafield(admin, "app_data", "deposit_product")

  await metafieldDefinitionUpsert(admin, {
    name: "Deposit type",
    namespace: "$app",
    key: "deposit",
    description: "Select the type of deposit the variant will come with.",
    type: "single_line_text_field",
    ownerType: "PRODUCTVARIANT" as MetafieldOwnerType,
    useAsCollectionCondition: true,
    pin: true,
    access: {
      admin: "MERCHANT_READ_WRITE",
    },
    validations: [
      {
        name: "choices",
        value: JSON.stringify(DEPOSIT_VARIANTS.map(v => v.title))
      }
    ]
  })
  await metafieldDefinitionUpsert(admin, {
    name: "Multipack base variant",
    namespace: "$app",
    key: "base_variant",
    description: "The base variant of the multipack.",
    type: "variant_reference",
    ownerType: "PRODUCTVARIANT" as MetafieldOwnerType,
    useAsCollectionCondition: false,
    pin: true,
    access: {
      admin: "MERCHANT_READ_WRITE",
    },
    validations: []
  })
  await metafieldDefinitionUpsert(admin, {
    name: "Multipack quantity",
    namespace: "$app",
    key: "quantity",
    description: "The quantity of the base product in this multipack.",
    type: "number_integer",
    ownerType: "PRODUCTVARIANT" as MetafieldOwnerType,
    useAsCollectionCondition: false,
    pin: true,
    access: {
      admin: "MERCHANT_READ_WRITE",
    },
    validations: []
  })
  await metafieldDefinitionUpsert(admin, {
    name: "Deposit title",
    namespace: "$app",
    key: "deposit_title",
    description: "The title used for this variant in the deposit select.",
    type: "single_line_text_field",
    ownerType: "PRODUCTVARIANT" as MetafieldOwnerType,
    useAsCollectionCondition: false,
    pin: false,
    access: {
      admin: "MERCHANT_READ",
    },
    validations: [
      {
        name: "choices",
        value: JSON.stringify(DEPOSIT_VARIANTS.map(v => v.title))
      }
    ]
  })

  logger.info(`done.`)

  logger.info(`Create deposit product`)
  const productCreateResult = await admin.graphql(`
    mutation productCreate($input: ProductInput!){
      productCreate(input: $input) {
        product {
          id
          options (first: 1){
            id
            name
            optionValues{
              id
              name
            }
          }
        }
      }
    }`, {
    variables: {
      input: {
        title: "Deposit", 
        vendor: "Hyghstreet",
        productOptions: [
          {
            name: "Type",
            values:[
              {
                name: "Default"
              }
            ]
          }
        ],
      },
      media:[
        {
          alt: 'Deposit symbol',
          mediaContentType: 'IMAGE',
          originalSource: `${process.env.SHOPIFY_APP_URL}/public/assets/pfand.png`
        }
      ]
    }
  }).then(res => res.json())
  console.log(productCreateResult)

  const product = productCreateResult.data.productCreate.product
  console.log(product)

  const variantCreateResult = await admin.graphql(`
    mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkCreate(productId: $productId, variants: $variants) {
        productVariants {
          id
        }
        userErrors {
          field
          message
        }
      }
    }`, {
    variables: {
      productId: product.id,
      variants: [
        ...DEPOSIT_VARIANTS.map(v => ({
          inventoryPolicy: "CONTINUE",
          price: v.price,
          requiresShipping: false,
          optionValues: {
            optionName: "Type",
            name: v.name
          },
          metafields: [
            {
              namespace: "$app",
              key: "deposit_title",
              value: v.title
            }
          ]
        }))
      ]
    }
  }).then(res => res.json())
  console.log(variantCreateResult.data.productVariantsBulkCreate)
  
  const variantsResult = await admin.graphql(`query productVariants($query: String!) {
    productVariants(query: $query, first: 100) {
        edges{
          node{
            title
            id
            depositTitle: metafield(namespace: "$app", key: "deposit_title"){
              value
            }
          }
        }
      }
    }`, {
      variables:{
        query: `(product_id:${product.id.split('/').at(-1)})`
      }
  }).then(res => res.json())

  const variants: ShopifyAPI.ProductVariant[] = variantsResult.data.productVariants?.edges.map((e: any) => e.node) ?? []
  const defaultVariant = variants.find((v: ShopifyAPI.ProductVariant) => v.title === "Default")
  console.log(defaultVariant)

  const variantDeleteResult = await variantDelete(admin, defaultVariant?.id ?? "")
  console.log(variantDeleteResult)
  
  await setMetafields(admin, [
    {
      key: 'hidden',
      namespace: 'seo',
      type: 'integer',
      ownerId: product.id,
      value: '1'
    }
  ])

  await setMetafields(admin, [
    {
      key: 'deposit_product',
      namespace: 'app_data',
      type: 'product_reference',
      ownerId: currentAppInstallation.id,
      value: product.id
    }
  ])

  logger.info(`done.`)

  logger.info(`Creating cart Transform.`)
  const cartTransformCreateResult = await createCartTransform(admin, `${process.env.SHOPIFY_CART_TRANSFORMER_ID}`)
  console.log(cartTransformCreateResult)
  if(!cartTransformCreateResult.cartTransform){
    logger.error('Failed creating cart transform')
    return
  }

  const configuration = DEPOSIT_VARIANTS.map(variant => ({
    ...variant,
    // @ts-ignore
    id: variants.find(v => (v.depositTitle?.value ?? "") == variant.title).id
  }))

  await setMetafields(admin, [
    {
      key: 'configuration',
      namespace: '$app',
      type: 'json',
      ownerId: cartTransformCreateResult.cartTransform.id,
      value: JSON.stringify(configuration)
    }
  ])
  logger.info(`done.`)
}
