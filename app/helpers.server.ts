import { AdminApiContext } from "node_modules/@shopify/shopify-app-remix/build/ts/server/clients";

export async function setMetafields(admin: AdminApiContext, metafields: any[]){
  const responseMetafield = await admin.graphql(
    `#graphql
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors {
            field
            message
          }
        }
      }`,
    {
      variables: {
        metafields: metafields,
      },
    }
);

  const responseMetafieldJson = await responseMetafield.json();

  const errors = [
    ...responseMetafieldJson.data.metafieldsSet?.userErrors,
  ];
  return errors
}


export async function getCurrentAppInstallationWithMetafield(admin: AdminApiContext, namespace: string, key: string){
    const responseAppInstallation = await admin.graphql(
      `#graphql
          query{
            currentAppInstallation {
              id
              metafield(key: "${key}", namespace: "${namespace}"){
                namespace
                key
                value
                type
              }
            }
    }`);

    const responseAppInstallationJson = await responseAppInstallation.json()

    return responseAppInstallationJson.data.currentAppInstallation
}

export async function deleteAutomaticDiscount(admin: AdminApiContext, id: string){
  const response = await admin.graphql(
      `#graphql
        mutation discountAutomaticDelete($id: ID!) {
          discountAutomaticDelete(id: $id) {
            deletedAutomaticDiscountId
            userErrors {
              field
              message
            }
          }
        }`,
      {
        variables: {
          id: id
        }
      }
  );

  const responseJson = await response.json();

  return responseJson.data.discountAutomaticDelete?.userErrors ?? ["discountAutomaticDelete failed"]
}


export async function deleteCartTransform(admin: AdminApiContext, id: string){
  const response = await admin.graphql(
      `#graphql
      mutation cartTransformDelete($id: ID!) {
        cartTransformDelete(id: $id) {
          deletedId
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          id: id
        }
      }
  );

  const responseJson = await response.json();

  return responseJson.data.cartTransformDelete?.userErrors ?? ["cartTransformDelete failed"]
}


export async function createCartTransform(admin: AdminApiContext, functionId: string){
    const response = await admin.graphql(
      `#graphql
        mutation cartTransformCreate($functionId: String!) {
          cartTransformCreate(functionId: $functionId) {
            cartTransform {
              id
              functionId
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
        variables: {
            functionId: functionId,
        },
      }
    );  

    const responseJson = await response.json();
    return {
      cartTransform: responseJson.data.cartTransformCreate,
      userErrors: responseJson.data.cartTransformCreate?.userErrors ?? ["cartTransformCreate failed"]
    };
}


export async function getCartTransform(admin: AdminApiContext, id: string){
    const response = await admin.graphql(
      `#graphql
      query ($id: ID!){
        node(id: $id) {
          id
          ... on CartTransform {
            functionId
            metafield(namespace:"${process.env.APP_NAMESPACE}", key:"function-configuration") {
              value
            }
          }
        }
      }`
  , {
    variables: {
      id: id
    }
  });

  const responseJson = await response.json();
  return responseJson.data.node
}

export async function getAutomaticDiscountNode(admin: AdminApiContext, id: string, configurationNamespace: string){
    const response = await admin.graphql(
      `#graphql
          query($id: ID!){
            automaticDiscountNode(id: $id){
              automaticDiscount{
                ... on DiscountAutomaticApp {
                  combinesWith{
                    orderDiscounts
                    productDiscounts
                    shippingDiscounts
                  }
                  discountClass
                  endsAt
                  startsAt
                  status
                  title
                  asyncUsageCount
                }
              }
              metafield(namespace: "${configurationNamespace}", key: "function-configuration"){
                value
                id
              }
            }
          }`,
      {
        variables: {
          id: id
        },
      }
  );

  const responseJson = await response.json();
  return responseJson.data.automaticDiscountNode
}

