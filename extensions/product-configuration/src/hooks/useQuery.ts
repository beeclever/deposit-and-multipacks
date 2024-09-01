import { useEffect, useState } from "react";

export function useQuery(query: string, variables: any = {}){
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({})
  const [errors, setErrors] = useState<any>([])

  useEffect(() => {
    fetch("shopify:admin/api/graphql.json", {
      method: "POST",
      body: JSON.stringify({
        query,
        variables
      }),
    })
    .then(res => res.json())
    .then(json => {
      console.log(json)
      if(json.errors){
        setErrors(json.errors)
        setLoading(false)
        return 
      }
      setData(json.data)
      setLoading(false)
    })
    .catch(error => {
      setErrors([error])
      setLoading(false)
    })
  },[])

  return {
    loading, data, errors
  }

}

export function useLazyQuery(query: string, defaultVariables: any = {}){
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>({})
  const [errors, setErrors] = useState<any>([])

  const run = async (variables: any = defaultVariables): Promise<any> => {
    setLoading(true)
    return await fetch("shopify:admin/api/graphql.json", {
      method: "POST",
      body: JSON.stringify({
        query,
        variables
      }),
    })
    .then(res => res.json())
    .then(json => {
      console.log(json)
      if(json.errors){
        setErrors(json.errors)
        setLoading(false)
        return json
      }
      setData(json.data)
      setLoading(false)
      return json
    })
    .catch(error => {
      setErrors([error])
      setLoading(false)
    })
  }

  return {
    loading, data, errors, run
  }

}