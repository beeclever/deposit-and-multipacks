import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const {admin} = await authenticate.admin(request);

  return redirect('/app/multipacks')
}