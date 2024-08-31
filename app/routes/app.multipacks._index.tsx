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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function Multipacks() {

  const multipacks: any[] = []

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
              renderItem={() => <></>}
              resourceName={{singular: 'Multipack', plural: 'Multipacks'}}
            />
        </BlockStack>
      </Card>
    </Page>
  );
}
