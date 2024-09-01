import {
  reactExtension,
  useApi,
  Text,
} from '@shopify/ui-extensions-react/admin';
import { useQuery } from "./hooks/useQuery";

// The target used here must match the target used in the extension's toml file (./shopify.extension.toml)

export default reactExtension<any>('admin.product-details.configuration.render', () => <App />);

function App() {
  
  const {data, i18n} = useApi<'admin.product-details.configuration.render'>();

  return (<>
    <Text>
      {i18n.translate('productConfiguration')}
    </Text>
  </>);
}