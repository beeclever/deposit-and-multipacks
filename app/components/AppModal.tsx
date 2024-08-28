import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { PropsWithChildren } from "react";

interface AppModalProps extends PropsWithChildren{
  title: string
  primaryLabel?: string
  primaryAction?: ( ) => void
  secondaryLabel?: string
  secondaryAction?: ( ) => void
}

export function AppModal({title, primaryLabel = "Confirm", primaryAction = () => {}, secondaryLabel = "Cancel", secondaryAction = () => {}, children}: AppModalProps){
  const shopify = useAppBridge();

  return <Modal 
  id="app-modal">
    {children}
  <TitleBar title={title}>
    <button onClick={() => {
      primaryAction()
      shopify.modal.hide('app-modal')
    }} variant="primary">{primaryLabel}</button>
    <button onClick={() => {
        secondaryAction()
        shopify.modal.hide('app-modal')
      }}>{secondaryLabel}</button>
  </TitleBar>
</Modal>
}