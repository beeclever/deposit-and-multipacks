import { useEffect, useState } from "react";


export function useQuery(fn: (...args: any[]) => Promise<{data: any, error: any}>, deps: any[] = []){
  const [data, setData] = useState<any>();
  const [error, setError] = useState<any>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fn().then(({ data, error }) => {
      setData(data)
      setError(error)
      setIsLoading(false)
    })
  }, deps)

  return {
    data, 
    error,
    isLoading
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
      // console.log(json)
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