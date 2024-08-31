import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import '@shopify/discount-app-components/build/esm/styles.css';
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import {AppProvider as DiscountsProvider} from '@shopify/discount-app-components';

import i18n from '~/i18n.server'
import { authenticate } from "../shopify.server";

export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
  // { rel: "stylesheet", href: discountComponentStyles }, discountComponentStyles from
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const language = i18n.language
  return json({ apiKey: process.env.SHOPIFY_API_KEY || "" });
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <DiscountsProvider locale="en-US" ianaTimezone="America/Los_Angeles">
        <NavMenu>
          <Link to="/app" rel="home">
            Home
          </Link>
          <Link to="/app/multipacks">Multipacks</Link>
          {/* <Link to="/app/settings">Settings</Link> */}
        </NavMenu>
        <Outlet />
      </DiscountsProvider>
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
