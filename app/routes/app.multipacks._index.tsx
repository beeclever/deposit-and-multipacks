import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  ResourceList,
  EmptyState,
  ResourceItem,
  FooterHelp,
  Thumbnail,
  IndexTable,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { getCurrentAppInstallationWithMetafield } from "~/helpers.server";
import { authenticate } from "~/shopify.server";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import { ProductIcon } from "@shopify/polaris-icons";
import getSymbolFromCurrency from 'currency-symbol-map'

const PAGE_SIZE = 50

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const {admin} = await authenticate.admin(request);

  const currentAppInstallation = await getCurrentAppInstallationWithMetafield(admin, "app_data", "deposit_product")
  const appId = currentAppInstallation.app.id.split('/').at(-1)
  const productArgs = [
    `query:"bundles:true AND product_configuration_owner:${appId}"`,
  ]
  const url = new URL(request.url);
  const before = url.searchParams.get("before");
  const after = url.searchParams.get("after");
  if(!!before){
    productArgs.push(`last: ${PAGE_SIZE}`)
    productArgs.push(`before: "${before}"`)
  }
  if(!!after){
    productArgs.push(`first: ${PAGE_SIZE}`)
    productArgs.push(`after: "${after}"`)
  }
  if(!before && !after){
    productArgs.push(`first: ${PAGE_SIZE}`)
  }
  console.log(productArgs.join(', '))
  const productsResult = await admin.graphql(`
    query products{
      products(${productArgs.join(', ')}) {
        edges {
          node {
            id
            title
            featuredImage{
              altText
              url
            }
            priceRangeV2{
              minVariantPrice{
                amount
                currencyCode
              }
              maxVariantPrice{
                amount
                currencyCode
              }
            }
          }
        }
        pageInfo{
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
      }
    }`).then(res => res.json())
  const products = productsResult.data.products.edges.map((e: any) => e.node)
  const pageInfo = productsResult.data.products.pageInfo

  console.log(products)

  return json({
    multipacks: products,
    appId,
    pageInfo
  });
};

export default function Multipacks() {

  const loaderData = useLoaderData<typeof loader>()

  const multipacks: any[] = loaderData.multipacks
  const pageInfo = loaderData.pageInfo

  const navigate = useNavigate()
  const nav = useNavigation()
  
  const isLoading = ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";

  console.log(multipacks)

  return (
    <Page title="Multipacks"  
    secondaryActions={multipacks.length > 0 ? [
      {
        content: "View in product list",
        url: `shopify://admin/products?bundles=true&product_configuration_owner=${loaderData.appId}`,
        target: "_blank"
      }
    ]: []}
    primaryAction={multipacks.length > 0 ? {
      content: 'Create multipack',
      url: './new'
    } : null}
    >
      <Card padding={"0"}>
        <BlockStack gap="300">
          <IndexTable
            headings={[
              { title: "", hidden: true },
              { title: "Title", alignment: "start" },
              { title: "Price", alignment: "end" },
            ]}
            loading={isLoading}
            pagination={{
              hasNext: pageInfo.hasNextPage,
              hasPrevious: pageInfo.hasPreviousPage,
              onNext: () => { navigate(`./?after=${pageInfo.endCursor}`) },
              onPrevious: () => { navigate(`./?before=${pageInfo.startCursor}`) },
            }}
            selectable={false}
            itemCount={multipacks.length}
            emptyState={ <EmptyState
              heading="Create a multipack to get started"
              action={{
                content: 'Create multipack',
                url: './new'
              }}
              image="https://cdn.shopify.com/shopifycloud/bundles_app/bundles/ceb532ccef7c2902c89422809dd2d8a5c8a9a6c6dc14ca89be7d4ce283e1ae95.svg"
            >
              <p>
                Group multiple units of the same product variant in a convenient multipack.
              </p>
            </EmptyState>}
          >
            {
              multipacks.map(({id, title, featuredImage, priceRangeV2}, index) => <IndexTable.Row 
                id={id} 
                position={index}
                onClick={() => {
                  // @ts-ignore
                  navigation.navigate(`shopify://admin/products/${id.split('/').at(-1)}`, {
                    history: 'push',
                  });
                }}
              >
              <IndexTable.Cell className="" >
                <Thumbnail
                  size="small"
                  alt={featuredImage?.altText ?? ""}
                  source={!!featuredImage ? featuredImage.url : ProductIcon}
                />
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="p" variant="bodyMd" fontWeight="bold"> {title}</Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="p" variant="bodyMd" alignment="end"> 
                  {getSymbolFromCurrency(priceRangeV2.minVariantPrice.currencyCode)}{Number(priceRangeV2.minVariantPrice.amount).toFixed(2)}
                  {
                  priceRangeV2.maxVariantPrice.amount != priceRangeV2.minVariantPrice.amount && 
                  ` - ${getSymbolFromCurrency(priceRangeV2.maxVariantPrice.currencyCode)}${Number(priceRangeV2.maxVariantPrice.amount).toFixed(2)}`
                  }
                </Text>
              </IndexTable.Cell>
            </IndexTable.Row>)
            }
          </IndexTable>
        </BlockStack>
      </Card>
      {/* <FooterHelp>
        Learn more about{' '}
        <Link url="./advanced">
          Multipacks
        </Link>
      </FooterHelp> */}
    </Page>
  );
}
