import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    const productResponse = await api.get(`products/${productId}`)
    const product = productResponse.data as Product

    const stockReponse = await api.get(`stock/${productId}`)
    const stock = stockReponse.data as Stock

    const productInCart = cart.find(product => product.id === productId)
    const amount = 1
    try {
      if (productInCart?.amount === stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
      }
      else {
        if (productInCart?.id === productId) {
          updateProductAmount({ productId, amount })
        }
        else {
          const newCart = [...cart, { ...product, amount: 1 }]

          setCart(newCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const removedArr = cart.filter(product => product.id !== productId ? product : '');
      setCart(removedArr);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(removedArr));

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {

    const product = cart.find(product => product.id === productId)
    const stockReponse = await api.get(`stock/${productId}`)
    const stock = stockReponse.data as Stock
    try {
      if (product) {
        if (product.amount <= 0) {
          return
        }
        else {
          if (stock.amount === product.amount) {
            toast.error('Quantidade solicitada fora de estoque');
          }
          else{
          const newArr = cart.map(prod => prod.id === productId ? {
            ...product,
            amount: product.amount + amount
          } : prod)
          setCart(newArr)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newArr));
          }
        }
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
