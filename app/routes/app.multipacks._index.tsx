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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { getCurrentAppInstallationWithMetafield } from "~/helpers.server";
import { authenticate } from "~/shopify.server";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const {admin} = await authenticate.admin(request);
  const currentAppInstallation = await getCurrentAppInstallationWithMetafield(admin, "app_data", "multipacks")
  const multipacks: string[] = JSON.parse(currentAppInstallation.metafield?.value ?? "[]")
  return json({
    multipacks
  });
};

export default function Multipacks() {

  const loaderData = useLoaderData<typeof loader>()

  const multipacks: any[] = loaderData.multipacks

  console.log(multipacks)

  return (
    <Page title="Multipacks"  
    primaryAction={multipacks.length > 0 ? {
      content: 'Create multipack',
      url: './new'
    } : null}
    >
      <Card>
        <BlockStack gap="300">
          <ResourceList
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
              items={multipacks}
              renderItem={(id) => <ResourceItem id={id} onClick={() => {}}>{id}</ResourceItem>}
              resourceName={{singular: 'Multipack', plural: 'Multipacks'}}
            />
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
