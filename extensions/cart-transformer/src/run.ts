import type {
  RunInput,
  FunctionRunResult,
  CartLine,
  CartOperation,
  Attribute,
  ProductVariant,
} from "../generated/api";

interface BeverageVariant extends ProductVariant{
  deposit: Attribute | null
  multipackBaseVariant: Attribute | null
  multipackQuantity: Attribute | null
}

interface DepositVariant{
  title: string
  price: number
  name: string
  id: string
}

export function run(input: RunInput): FunctionRunResult {
  
  const config = (input.cartTransform.config?.jsonValue ?? []) as DepositVariant[]

  // @ts-ignore
  const productWithDeposit: CartLine[] = input.cart.lines
  .filter(line => line.merchandise.__typename == "ProductVariant" && !!line.merchandise.deposit)

  const operations = productWithDeposit.map(line => {
    if(line.merchandise.__typename != "ProductVariant") return null;

    const variant = line.merchandise as BeverageVariant

    const depositType = variant.deposit?.value ?? ""
    const depositVariant = config.find(v => v.title == depositType)

    if(!depositVariant) return null;

    const baseVariantId = variant.multipackBaseVariant?.value ?? line.merchandise.id;
    const quantity = Number(variant.multipackQuantity?.value ?? 1)
    const price = line.cost.amountPerQuantity.amount / quantity

    return {
      expand: {
        cartLineId: line.id,
        expandedCartItems: [
          {
            merchandiseId: baseVariantId,
            quantity: quantity,
            price: {
              adjustment: {
                fixedPricePerUnit: {
                  amount: price 
                }
              }
            }
          },
          {
            merchandiseId: depositVariant.id,
            quantity: quantity,
            price: {
              adjustment: {
                fixedPricePerUnit: {
                  amount: String(depositVariant.price)
                }
              }
            }
          }
        ]
      }
    } as CartOperation
  })
  .filter(o => !!o)

  return {
    operations: operations,
  };
};