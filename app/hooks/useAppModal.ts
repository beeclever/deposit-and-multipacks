

export function useAppModal(){
  return {
    show: () => shopify.modal.show('app-modal')
  }
}