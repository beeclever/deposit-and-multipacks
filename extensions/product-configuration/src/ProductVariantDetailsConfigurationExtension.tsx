import {
  reactExtension,
  useApi,
  Text,
  NumberField,
  InlineStack,
  // ProgressIndicator,
} from '@shopify/ui-extensions-react/admin';
import { useQuery } from "./hooks/useQuery";

// The target used here must match the target used in the extension's toml file (./shopify.extension.toml)

export default reactExtension<any>('admin.product-variant-details.configuration.render', () => <App />);

function App() {
  
  const {extension: {target}, data: {variant}, i18n} = useApi<'admin.product-variant-details.configuration.render'>();


  const { data: { productVariant }, loading, errors } = useQuery(`
  query productVariant($id: ID!){
    productVariant(id: $id) {
      deposit: metafield(namespace: "$app", key: "deposit"){
        value
      }
      quantity: metafield(namespace: "$app", key: "quantity"){
        value
      }
      baseVariant: metafield(namespace: "$app", key: "base_variant"){
        value
      }
    }
  }`, {
    id: `gid://shopify/ProductVariant/${variant.id}`
  })

  console.log(productVariant)
  // return <></>
  return loading 
    ? <>
      {/* <ProgressIndicator size="small-200" /> */}
    </> 
    : <>
    	<InlineStack gap>
        {/* <Image alt="Pickaxe" source="/assets/icons/64/pickaxe-1.png" /> */}
        <Text>
          {productVariant?.baseVariant?.value ?? ""}
        </Text>
        <NumberField label="Quantity" readOnly value={productVariant?.quantity?.value ?? ""} />
      </InlineStack>
     ^
    </>
}