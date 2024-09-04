import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { json, useActionData, useLoaderData, useNavigate, useNavigation, useSubmit } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  Select,
  TextField,
  InlineStack,
  Spinner,
  Button,
  EmptyState,
  InlineGrid,
  Thumbnail,
  Checkbox,
  Icon,
  Divider,
  Tag,
  Tooltip,
} from "@shopify/polaris";
import { CheckIcon, MagicIcon, ProductIcon } from "@shopify/polaris-icons";
import { ShopifyAPI } from "clever_tools";
import { useEffect, useState } from "react";
import { getCurrentAppInstallationWithMetafield, setMetafields, variantDelete } from "~/helpers.server";
import { authenticate } from "~/shopify.server";

const BACK = '/app/multipacks'


export const loader = async ({ request }: LoaderFunctionArgs) => {
  const {admin} = await authenticate.admin(request);

  return json({
    
  })
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  const data = await request.json()
  // console.log(data)
  // * Create multipack product
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
        title: data.title, 
        vendor: "beeclever",
        customProductType: "Multipack",
        status: "DRAFT",
        claimOwnership:{
          bundles: true
        },
        productOptions: [
          ...data.selectedOptions.map((option: any) => ({
            name: option.name,
            values: [{
              name: "Default"
            }]
          })),
        ]
      }
    }
  }).then(res => res.json())
  // console.log(productCreateResult)

  const product = productCreateResult.data.productCreate.product

  // * Get default variant
  const variants = await admin.graphql(`query productVariants($query: String!) {
    productVariants(query: $query, first: 100) {
        edges{
          node{
            title
            id
          }
        }
      }
    }`, {
      variables:{
        query: `(product_id:${product.id.split('/').at(-1)})`
      }
  }).then(res => res.json())

  const defaultVariant = variants.data.productVariants.edges.map((e: any) => e.node)[0]
  // console.log(defaultVariant)

  // * Get variants of base product
  const baseProductVariantsResult = await admin.graphql(`query productVariants($query: String!) {
    productVariants(query: $query, first: 100) {
        edges{
          node{
            title
            id
            deposit: metafield(namespace: "$app", key: "deposit"){
              value
            }
            selectedOptions{
              name
              value
            }
          }
        }
      }
    }`, {
      variables:{
        query: `(product_id:${data.productId.split('/').at(-1)})`
      }
  }).then(res => res.json())
  // console.log(baseProductVariantsResult)

  const baseVariants: ShopifyAPI.ProductVariant[] = baseProductVariantsResult.data.productVariants.edges.map((e: any) => e.node)
  // console.log(baseVariants)
  // * Create variants of multipack
  const updateVariantsResults = await Promise.all(data.variants.map((variant: any) => {
    const baseVariant = baseVariants.find(v => v.id == variant.id)
    return admin.graphql(`
      mutation productVariantCreate($input: ProductVariantInput!) {
      productVariantCreate(input: $input) {
        productVariant {
          id
        }
        userErrors {
          message
          field
        }
      }
    }`, {
        variables: {
          input: {
            productId: product.id,
            requiresComponents: true,
            inventoryItem: {
              tracked: false,
            },
            options: variant.selectedOptions.map((option: any) => option.value),
            price: String((Number(data.quantity) * Number(variant.price)).toPrecision(2)),
            metafields: [
              {
                namespace: "$app",
                key: "base_variant",
                value: variant.id,
              },
              {
                namespace: "$app",
                key: "quantity",
                value: data.quantity,
              },
              {
                namespace: "$app",
                key: "deposit",
                // @ts-ignore
                value: String(baseVariant.deposit?.value ?? ""),
              }
            ]
          }
        }
    }).then(res => res.json())
  }))

  
  // console.log(updateVariantsResults.map(updateVariantsResult => updateVariantsResult.data.productVariantCreate.productVariant))


  const variantDeleteResult = await variantDelete(admin, defaultVariant?.id ?? "")
  // console.log(variantDeleteResult)

  return json({
    productid: `${product.id}`
  })
};

export default function NewMultipack() {

  const submit = useSubmit()
  // const navigate = useNavigate()
  const shopify = useAppBridge();
  const actionData = useActionData<typeof action>()
  const loaderData = useLoaderData<typeof loader>()

  if(!!actionData?.productid){
    shopify.toast.show('Multipack created')
    // @ts-ignore
    navigation.navigate(`shopify://admin/products/${actionData.productid.split('/').at(-1)}`, {
      history: 'push',
    });
  }

  const [product, setProduct] = useState<any | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<any | null>(null)
  const [quantity, setQuantity] = useState<string>("1")

  const [title, setTitle] = useState("")
 
  const nav = useNavigation();
  const isLoading = ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";


  const openResourcePicker = (searchQuery = "") => shopify.resourcePicker({
    type: 'product',
    action: "select",
    selectionIds: [],
    multiple: false,
    query: searchQuery
  })
  .then(async (selectedPayload) => {
      // console.log(selectedPayload)
      if(!selectedPayload) return;
      setProduct(selectedPayload[0])
  });

  useEffect(() => {
    if(!product) return;

    const selectedOptionsTmp = product.options.map((option: ShopifyAPI.ProductOption) => ({
      ...option,
      selectedValues: option.values.reduce((map: any, value: string) => ({ ...map, [value]: true }), {})
    }))
    setSelectedOptions(selectedOptionsTmp)
  }, [product])

  // console.log(product?.variants)

  const countVariants = () : number => {
    const selectedVariants = getSelectedVariants()
    const variantCount = selectedVariants.length
    return variantCount
  }

  const readyToSubmit = () : boolean => {
    const variantCount = countVariants()
    return title != "" && Number(quantity) > 1 && !!selectedOptions && (selectedOptions?.length ?? 0) <= 3 && !!product && variantCount <= 100
  }

  const getSelectedVariants = () => {
    if(!selectedOptions) return []

    const selectedVariants = product?.variants
    // find all variants
    .filter((variant: any) => variant.selectedOptions
      // where all selected options match the products selected options
      .every((option: any, index: number) => {
        const selectedOptionValues = Array.from(Object.entries(selectedOptions[index].selectedValues)).filter(([k, v]) => v === true).map(([k, v]) => k)
        // console.log('selectedOptionValues',selectedOptionValues)
        return selectedOptionValues.includes(option.value) 
      })
    ) ?? []
    // console.log('selectedVariants',selectedVariants)
    return selectedVariants
  }
 

  return (
    <Page backAction={{
        url: BACK
      }} 
      title="Create multipack">
      <Layout>
        <Layout.Section>
          <BlockStack gap="300">
            <Card>
              <BlockStack gap="300">
                <TextField 
                  label="Title" 
                  value={title} 
                  autoComplete="off" 
                  onChange={setTitle}/>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="300">
                {
                  !product 
                    ? <>
                      <EmptyState
                      // heading="Select the product you want to create a multipack for"
                      action={{
                        content: 'Select Product',
                        onAction: () => openResourcePicker()
                      }}
                      image="https://cdn.shopify.com/shopifycloud/bundles_app/bundles/ceb532ccef7c2902c89422809dd2d8a5c8a9a6c6dc14ca89be7d4ce283e1ae95.svg"
                    >
                      <p>
                        Select the product that serves as the basis for your multipack.
                      </p>
                    </EmptyState></> 
                    : <>
                      <Box>
                        <BlockStack gap="200">
                        <InlineStack gap="200" blockAlign="center" align="space-between" >
                          <InlineStack gap="200" blockAlign="center"  >
                            <Thumbnail
                              size="small"
                              source={product.images[0]?.originalSrc ?? ProductIcon}
                              alt={product.images[0]?.altText ?? ""}
                            />
                            <BlockStack>
                              <Text variant="headingXs" as="p">
                                {product.title}
                              </Text>
                            </BlockStack>
                          </InlineStack>
                          <InlineStack gap="200" blockAlign="center"  >
                            <TextField 
                              label={"Quantity"} 
                              labelHidden
                              autoComplete="off" 
                              type="number" 
                              value={quantity} 
                              onChange={setQuantity}></TextField>
                          </InlineStack>
                        </InlineStack>
                        { !!selectedOptions && <>
                          {
                          product.options.map((option: ShopifyAPI.ProductOption, index:number) => <>
                            <BlockStack gap={"100"}>
                              <Text as="p">{ option.name }</Text>
                              <InlineStack gap="100" wrap>
                              {
                                option.values.map(value => {
                                  const checked = selectedOptions[index].selectedValues[value]
                                  const iconProp = checked ? { icon: <Icon source={CheckIcon}></Icon> } : {}
                                  return <>
                                    <Button 
                                    {...iconProp}
                                    variant={checked ? "primary": "secondary"}
                                    onClick={() => {
                                      const selectedOptionsTmp = [...selectedOptions]
                                      selectedOptionsTmp[index].selectedValues[value] = !checked
                                      setSelectedOptions(selectedOptionsTmp)
                                    }}
                                    >
                                      {value}
                                    </Button>
                                  </>
                                })
                              }
                              </InlineStack>
                            </BlockStack>
                          </>)
                        }
                        </> }
                        
                        </BlockStack>
                      </Box>
                    </>
                }
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="p" variant="headingXs">Multipack</Text>
              <Text as="p" tone="subdued">A multipack that includes multiple units of the same product variant, offering the same item in a convenient, bundled package.</Text>
              <List type="bullet">
                <List.Item>{selectedOptions?.length ?? 0}/3 options</List.Item>
                <List.Item>{countVariants()}/100 variants</List.Item>
              </List>
              <Divider></Divider>
              {!!selectedOptions && <>
                <Text as="p" variant="headingXs">Options</Text>
                <Text as="p" tone="subdued">Buyers will be able to choose from these options.</Text>
                {
                  selectedOptions.map((option:any) => <BlockStack gap="100">
                    <Text as="p">{option.name}</Text>
                    <InlineStack gap="100" wrap>
                      {
                        Array.from(Object.entries(option.selectedValues))
                        .filter(([k,v]) => v === true)
                        .map(([k,v]) => <Tag>
                          { k }
                        </Tag>)
                      }
                    </InlineStack>
                  </BlockStack>)
                }
                <Divider></Divider>
              </>}
              
              <Button 
                variant="primary"
                disabled={!readyToSubmit()}
                loading={isLoading}
                onClick={() => submit({
                  title,
                  productId: product.id,
                  selectedOptions,
                  quantity,
                  variants: getSelectedVariants()
                }, {
                  action: './',
                  method: 'POST',
                  encType:"application/json"
                })}>
                Save & continue
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      
    </Page>
  );
}
