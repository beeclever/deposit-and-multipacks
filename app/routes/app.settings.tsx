import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  Button,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { AppSaveBar } from "~/components/AppSaveBar";
import { useState } from "react";
import { Code } from "~/components/Code";

export default function SettingsPage() {

  const [hasChanges, setHasChanges] = useState(false)

  return (
    <Page>
      <TitleBar title="Settings" />

      <AppSaveBar show={hasChanges} onSave={() => setHasChanges(false)} onDiscard={() => setHasChanges(false)}/>

      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="p" variant="bodyMd">
                The app template comes with a settings page which
                demonstrates how to use the custom <Code>&lt;AppSaveBar&gt;</Code> component.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Resources
              </Text>
              <List>
                <List.Item>
                  <Link
                    url="https://shopify.dev/docs/api/app-bridge-library/react-components/savebar#savebar-with-different-options-showing-a-discard-confirmation-modal"
                    target="_blank"
                    removeUnderline
                  >
                    App Bridge SaveBar
                  </Link>
                </List.Item>
              </List>
              <Button onClick={() => setHasChanges(true)}>Trigger savebar</Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
