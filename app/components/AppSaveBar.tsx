import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";

interface AppSaveBarProps{
  onSave?: () => void
  onDiscard?: () => void
  show: boolean
}

export function AppSaveBar({ onSave = () => {}, onDiscard = () => {}, show }: AppSaveBarProps){
  const shopify = useAppBridge();

  const [saving, setSaving] = useState(false)
  const [discarding, setDiscarding] = useState(false)

  const handleSave = () => {
    setSaving(true)
    onSave()
    setSaving(false)
    shopify.saveBar.hide('app-save-bar');
  };

  const handleDiscard = () => {
    setDiscarding(true)
    onDiscard()
    setDiscarding(false)
    shopify.saveBar.hide('app-save-bar');
  };

  return <SaveBar id="app-save-bar" open={show}>
    <button { ...(saving ? { loading: ''} : {}) } variant="primary" onClick={handleSave}></button>
    <button { ...(discarding ? { loading: ''} : {}) } onClick={handleDiscard}></button>
  </SaveBar>
}