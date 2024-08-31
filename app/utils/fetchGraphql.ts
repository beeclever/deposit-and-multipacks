interface FetchGraphqlResult{
  data: any | null
  error: any | null
}

export const fetchGraphql = async (query: string, variables: any = {}) : Promise<FetchGraphqlResult> => {
  return await fetch('shopify:admin/api/graphql.json', {
    method: 'POST',
    body: JSON.stringify({
      query: query,
      variables: variables,
    }),
  })
  .then(res => res.json())
  .then(json => {
    // console.log(json)
    return ({ data: json.data, error: null })
  })
  .catch(error => ({ data: null, error: error }))
}