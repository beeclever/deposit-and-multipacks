import { useEffect } from "react";
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
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import logger from "~/logger.server";
import { useTranslation } from "react-i18next";
import i18n from '~/i18n.server'
import { ShopifyAPI } from "clever_tools";
import { install } from "~/app.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  await install(admin)
  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  return json({
  });
};

export default function Index() {
  const { t, i18n } = useTranslation();
  const nav = useNavigation();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const shopify = useAppBridge();
  const isLoading = ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";
  
  return (
    <Page>
      <TitleBar title={"Setup"} />
     
    </Page>
  );
}
