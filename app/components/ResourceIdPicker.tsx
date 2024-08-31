
import { gql } from "graphql-request";
import { Product } from "@shopify/app-bridge-core/actions/ResourcePicker";
import { BlockStack, Box, Button, Divider, Icon, InlineGrid, InlineStack, SkeletonBodyText, SkeletonDisplayText, Spinner, Text, TextField, Thumbnail } from "@shopify/polaris"
import { useEffect, useState } from "react";
import { fetchGraphql } from "~/utils/fetchGraphql";
import {
  ProductIcon,
  SearchIcon,
  XIcon
} from '@shopify/polaris-icons';
import { useAppBridge } from "@shopify/app-bridge-react";
import { ShopifyAPI } from "clever_tools";

interface ResourceIdPickerProps{
  initialIds: string[]
  onChange: (value: string[]) => void
  resourceType: "variant" | "product",
  multiple?: boolean 
}

const VARIANT_QUERY = gql`
  query($id: ID!) {
    productVariant(id: $id){
      id
      title
      product{
        id
        title
        status
        featuredImage{
          url
          altText
        }
      }
    }
  }
`;

const PRODUCT_QUERY = gql`
  query($id: ID!) {
    product(id: $id){
      id
      title
      status
      featuredImage{
        url
        altText
      }
    }
  }
`;

interface ProductToVariantsMap { 
  [productId: string]: ShopifyAPI.ProductVariant[] 
}

export function ResourceIdPicker({ initialIds, onChange, resourceType, multiple = false }: ResourceIdPickerProps){

  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds); 
  const [resourcePickerOpen, setResourcePickerOpen] = useState<boolean>(false);

  const internalResourceType = resourceType == "variant" ? "product" : resourceType

  const [isLoading, setIsLoading] = useState(true)

  const [variantsByProduct, setVariantsByProduct] = useState<ProductToVariantsMap>({})

  const [initialSelectionIds, setInitialSelectionIds] = useState(resourceType == "variant" ? [] : initialIds.map(id => ({ id })))

  const fetchVariants = (ids: string[]) => {
    Promise.all(
      ids
      .map(id => fetchGraphql(VARIANT_QUERY, { id: id }).then(({data, error}) => data.productVariant as ShopifyAPI.ProductVariant))
    )
    .then(res => {
        // group variants by products
        const vByP = res.reduce((acc, i) => ({
                ...acc,
                [i.product.id]: (!!acc[i.product.id] ? Array.from(new Set([...acc[i.product.id], i])) : [i])
          }),{} as ProductToVariantsMap)

          setVariantsByProduct(vByP)
        // create initial selection for products with selected variants
        setInitialSelectionIds(Object.entries(vByP).map(([key, value]) => ({
          id: key,
          variants: value.map(v => ({ id: v.id }))
        })))

        setIsLoading(false)
    })
  }

  const fetchProducts = (ids: string[]) => {
    Promise.all(
      ids
      .map(id => fetchGraphql(PRODUCT_QUERY, { id: id }).then(({data, error}) => data.product as Product))
    )
    .then(res => {
        // group variants by products
        const vByP = res.reduce((acc, i) => ({
                ...acc,
                [i.id]: [{
                  id: "",
                  title: "",
                  product: i 
                } as any as ShopifyAPI.ProductVariant]
          }),{} as ProductToVariantsMap)

          setVariantsByProduct(vByP)

        // create initial selection for products with selected variants
        if(resourceType == "variant"){
          setInitialSelectionIds(Object.entries(vByP).map(([key, value]) => ({
            id: key,
            variants: value.map(v => ({ id: v.id }))
          })))
        }

        setIsLoading(false)
    })
  }

  useEffect(() => {
    if(resourceType == "variant"){
      fetchVariants(initialIds)
    }
    if(resourceType == "product"){
      fetchProducts(initialIds)
    }
  }, [])

  useEffect(() => {
    onChange(selectedIds)
    if(resourceType == "variant"){
      fetchVariants(selectedIds)
    }
    if(resourceType == "product"){
      fetchProducts(selectedIds)
    }
  }, [selectedIds])

  const shopify = useAppBridge();


  const openResourcePicker = (searchQuery = "") => shopify.resourcePicker({
    type: internalResourceType,
    action: "select",
    selectionIds: initialSelectionIds,
    multiple: multiple,
    query: searchQuery
  }).then((selectedPayload) => {
      console.log(selectedPayload)
      if(!selectedPayload){
        return
      }
      if(resourceType == "variant"){
        setSelectedIds(selectedPayload.map((s) => (s as Product).variants).flat().map(v => v.id as string))
      }
      else{
        setSelectedIds(selectedPayload.map(s => s.id))
      }
      setResourcePickerOpen(false)
  });

  const interleave = (arr: any, thing: any) => [].concat(...arr.map((n:any) => [n, thing])).slice(0, -1)
  
  return isLoading ? <><SkeletonDisplayText></SkeletonDisplayText></> : (<>
    <BlockStack gap="200">
        <TextField
            label="Search"
            labelHidden
            autoComplete="off"
            value={""}
            onChange={(value) => openResourcePicker(value)}
            prefix={<Icon source={SearchIcon}></Icon>}
            placeholder="Search products"
            connectedRight={<Button
              onClick={() => openResourcePicker()}
              >
                  {`Browse`}
              </Button>}
          />
        
        { Object.entries(variantsByProduct).length > 0 && <Box padding={"0"} borderStyle="solid" borderColor="border" borderWidth="025" borderRadius="200">
          <BlockStack>
          {
            interleave(Object.entries(variantsByProduct).map(([productId, [firstVariant, ...variants]]) => <Box padding={"200"}>
              <InlineGrid key={productId} gap="200" alignItems="center" columns={"auto 1fr 28px"}>
                <Thumbnail
                  size="small"
                  source={firstVariant.product.featuredImage?.url ?? ProductIcon}
                  alt={firstVariant.product.featuredImage?.altText ?? ""}
                />
                <BlockStack>
                  <Text variant="headingXs" as="p">
                    {firstVariant.product.title}
                  </Text>
                  {
                  !!firstVariant.title && 
                    <Text as="p">
                      {[firstVariant.title, ...variants.map(v => v.title)].join(", ")}
                    </Text>
                  }
                </BlockStack>
                <Button icon={XIcon} size="micro" variant="tertiary" onClick={() => {
                  if(resourceType == "variant"){
                    const variantIds = [firstVariant, ...variants].map(v => v.id)
                    const withoutThisProduct = selectedIds.filter(s => !variantIds.includes(s))
                    setSelectedIds(withoutThisProduct)
                  }
                  if(resourceType == "product"){
                    const withoutThisProduct = selectedIds.filter(s => s != productId)
                    setSelectedIds(withoutThisProduct)
                  }
                }}>

                </Button>
              </InlineGrid>
            </Box>), <Divider/>)
          }
          </BlockStack>
        </Box>}
    </BlockStack>
    </>)
}