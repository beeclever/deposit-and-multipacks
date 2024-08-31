import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { json, useActionData, useNavigate, useNavigation, useSubmit } from "@remix-run/react";
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
} from "@shopify/polaris";
import { ShopifyAPI } from "clever_tools";
import { useState } from "react";
import { AppSaveBar } from "~/components/AppSaveBar";
import { ResourceIdPicker } from "~/components/ResourceIdPicker";
import { getCurrentAppInstallationWithMetafield, setMetafields } from "~/helpers.server";
import { useLazyQuery, useQuery } from "~/hooks/query";
import { authenticate } from "~/shopify.server";
import { fetchGraphql } from "~/utils/fetchGraphql";

const BACK = '/app/multipacks'

// Todo: Multipack of a complete product

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  const data = await request.json()
  console.log(data)

  const baseVariantResult = await admin.graphql(`query productVariant($id: ID!){
    productVariant(id: $id) {
      title
      price
      product{
        id
        options(first: 3){
          id
          name
          optionValues{
            id
            name
          }
        }
      }
      selectedOptions{
        name
        value
      }
      deposit: metafield(namespace: "$app", key: "deposit"){
        value
      }
    }
  }`, {
      variables:{
        id: data.variant
      }
  }).then(res => res.json())

  const baseVariant: ShopifyAPI.ProductVariant = baseVariantResult.data.productVariant


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
        vendor: "Hyghstreet",
        claimOwnership:{
          bundles: true
        }
      }
    }
  }).then(res => res.json())
  console.log(productCreateResult)

  const product = productCreateResult.data.productCreate.product


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

  const defaultVariant = variants.data.productVariants.edges.map((e: any) => e.node).find((v: ShopifyAPI.ProductVariant) => v.title === "Default Title")
  console.log(defaultVariant)

  const updateVariantsResult = await admin.graphql(`
    mutation productVariantUpdate($input: ProductVariantInput!) {
      productVariantUpdate(input: $input) {
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
          id: defaultVariant.id,
          requiresComponents: true,
          price: String((Number(data.quantity) * (baseVariant.price)).toPrecision(2)),
          inventoryItem: {
            requiresShipping: false,
          },
          metafields: [
            {
              namespace: "$app",
              key: "base_variant",
              value: data.variant,
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
  
  console.log(updateVariantsResult)

  const currentAppInstallation = await getCurrentAppInstallationWithMetafield(admin, "app_data", "multipacks")
  const multipacks: string[] = JSON.parse(currentAppInstallation.metafield?.value ?? "[]")
  await setMetafields(admin, [
    {
      key: 'multipacks',
      namespace: 'app_data',
      type: 'list.product_reference',
      ownerId: currentAppInstallation.id,
      value: JSON.stringify([...multipacks, product.id])
    }
  ])

  return json({
    productUrl: `shopify://admin/products/${product.id}`
  })
};

export default function NewMultipack() {

  const submit = useSubmit()
  const navigate = useNavigate()

  const actionData = useActionData<typeof action>()

  if(!!actionData?.productUrl){
    // Todo: Fix redirect
    // navigate(actionData.productUrl) 
  }

  const [title, setTitle] = useState("")
  const [variant, setVariant] = useState("")
  const [quantity, setQuantity] = useState("")
  const nav = useNavigation();
  const isLoading = ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";

  const readyToSubmit = () : boolean => {
    return title != "" && variant != "" && !!variant && quantity != ""
  }


  return isLoading ? <Spinner></Spinner> : (
    <Page backAction={{
        url: BACK
      }} 
      title="Create multipack">
      <Layout>
        <Layout.Section>
          <BlockStack gap="300">
            <Card>
              <BlockStack gap="300">
                <TextField label="Title" value={title} autoComplete="off" onChange={setTitle}></TextField>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="300">
                <Select 
                  label="Quantity"
                  placeholder="Select a quantity"
                  options={[4, 6, 12, 20, 24, 36, 48, 72].map(size => ({
                    value: String(size),
                    label: String(size)
                  }))}
                  value={quantity}
                  onChange={setQuantity}
                ></Select>

                <Text as="p">Product variant</Text>

                <ResourceIdPicker
                initialIds={[]}
                onChange={async (variants) => {
                  const variant = variants[0]
                  setVariant(variant)
                }}
                resourceType="variant"
                ></ResourceIdPicker>
                
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="p" variant="headingXs">Multipack</Text>
              <Text as="p">A multipack that includes multiple units of the same product variant, offering the same item in a convenient, bundled package.</Text>
              <Button 
                variant="primary"
                disabled={!readyToSubmit()}
                onClick={() => submit({
                  title, variant, quantity
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
