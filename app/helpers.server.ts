import { AdminApiContext } from "@shopify/shopify-app-remix/server";
import { ShopifyAPI } from "clever_tools";
import { PromiseHooks } from "v8";

export async function setMetafields(admin: AdminApiContext, metafields: ShopifyAPI.MetafieldsSetInput[]){
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


export async function getCurrentAppInstallationWithMetafield(admin: AdminApiContext, namespace: string, key: string): Promise<ShopifyAPI.AppInstallation>{
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
            functionId: functionId
        },
      }
    );  

    const responseJson = await response.json();
    return {
      cartTransform: responseJson.data.cartTransformCreate?.cartTransform ?? null,
      userErrors: responseJson.data.cartTransformCreate?.userErrors ?? []
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


export async function metafielDefinitionCreate(admin: AdminApiContext, definition: ShopifyAPI.MetafieldDefinitionInput){
  const response = await admin.graphql(`
      mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition {
            id
            name
          }
          userErrors {
            field
            message
            code
          }
        }
      }`,
    {
      variables: {
        definition: definition,
      },
    }
  );  

  const responseJson = await response.json();
  return {
    cartTransform: responseJson.data.metafieldDefinitionCreate,
    userErrors: responseJson.data.metafieldDefinitionCreate?.userErrors ?? []
  };
}

export async function metafieldDefinitionUpdate(admin: AdminApiContext, definition: ShopifyAPI.MetafieldDefinitionUpdateInput){
  const response = await admin.graphql(`
     mutation UpdateMetafieldDefinition($definition: MetafieldDefinitionUpdateInput!) {
      metafieldDefinitionUpdate(definition: $definition) {
        updatedDefinition {
          id
          name
        }
        userErrors {
          field
          message
          code
        }
      }
    }`,
    {
      variables: {
        definition: definition,
      },
    }
  );  

  const responseJson = await response.json();
  return {
    cartTransform: responseJson.data.metafieldDefinitionCreate,
    userErrors: responseJson.data.metafieldDefinitionCreate?.userErrors ?? []
  };
}


export async function metafieldDefinition(admin: AdminApiContext, ownerType: ShopifyAPI.MetafieldOwnerType, namespace: string, key: string){
  const response = await admin.graphql(`
    query MetafieldDefinitions($ownerType: MetafieldOwnerType!, $namespace: String!, $key: String!){
      metafieldDefinitions(first: 1, ownerType: $ownerType, namespace: $namespace, key: $key) {
        edges {
          node {
            id
            name
          }
        }
      }
    }`,
    {
      variables: {
        ownerType: ownerType,
        namespace: namespace,
        key: key,
      },
    }
  );  

  const responseJson = await response.json();
  return responseJson.data.metafieldDefinitions.edges[0]?.node;
}


export async function metafieldDefinitionUpsert(admin: AdminApiContext, definition: ShopifyAPI.MetafieldDefinitionInput){
  const existing = await metafieldDefinition(admin, definition.ownerType, String(definition.namespace), definition.key)

  if(!existing){
    return await metafielDefinitionCreate(admin, definition);
  }
  const { type, access, ...fields } = definition;
  return await metafieldDefinitionUpdate(admin, {
    ...fields,
  });

}

export async function variantDelete(admin: AdminApiContext, variantId: string): Promise<boolean>{
  const res = await admin.graphql(`mutation productVariantDelete($id: ID!) {
      productVariantDelete(id: $id) {
        deletedProductVariantId
        product {
          id
          title
        }
        userErrors {
          field
          message
        }
      }
    }`, {
      variables:{
        id: variantId
      }
  }).then(res => res.json())

  return res.data.productVariantDelete.userErrors.length == 0
}