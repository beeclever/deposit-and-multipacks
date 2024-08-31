import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  Checkbox,
  DescriptionList,
  Collapsible,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import logger from "~/logger.server";
import { useTranslation } from "react-i18next";
import i18n from '~/i18n.server'
import { ShopifyAPI } from "clever_tools";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  i18n.t('app.name')
  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  return json({
  });
};

export default function Index() {
  const { t } = useTranslation();
  const nav = useNavigation();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const shopify = useAppBridge();
  const isLoading = ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";
  const [learnMoreOpen, setLearnMoreOpen] = useState(false)
  return (
    <Page title={t('app.name')}>
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="300" inlineAlign="start">
                <Text as="h2" variant="headingMd">Setting Up Deposits for a Beverage Product</Text>
                <Text as="p">
                  To set up a deposit for a beverage product, go to the product's variant settings in your Shopify dashboard. Look for the deposit option in the variant metafield and select the appropriate deposit type from the dropdown menu. This will automatically apply the selected deposit amount at checkout, ensuring compliance with regional regulations. &nbsp; 
                {
                  !learnMoreOpen && <Button variant="plain" onClick={() => setLearnMoreOpen(!learnMoreOpen)}> 
                    Learn more
                  </Button>
                }
                </Text>
                <Collapsible
                    open={learnMoreOpen}
                    id="basic-collapsible"
                    transition={{duration: '500ms', timingFunction: 'ease-in-out'}}
                    expandOnPrint
                  >
                    <Text as="h2" variant="headingSm">How it works</Text>
                    <Text as="p">
                      As part of the deposit feature, a special deposit product has been automatically added to your store. This product is used to apply and track the deposit fees for beverage containers during checkout. It’s hidden from your storefront but functions behind the scenes to ensure that the correct deposit amount is charged and displayed to your customers. You don’t need to manage this product directly—just set up the deposit type in the variant metafield, and the app will handle the rest.
                    </Text>
                    
                </Collapsible>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="300"  inlineAlign="start">
                <Text as="h2" variant="headingMd"> Getting Started with Multipacks</Text>
                <Text as="p">
                  Easily set up your first multipack by selecting the beverages you want to bundle and customizing the pricing. With just a few clicks, you can start offering attractive bulk options to your customers directly from your Shopify dashboard.
                </Text>
                <Button url="./multipacks">Get started</Button>
              </BlockStack>
            </Card>
           </BlockStack>
          </Layout.Section>
          {/* <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">...</Text>
              </BlockStack>
            </Card>
          </Layout.Section> */}
        </Layout>
      
    </Page>
  );
}
