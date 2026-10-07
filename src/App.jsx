import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import StoreLayout from './pages/StoreLayout.jsx';
import MenuPage from './pages/MenuPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderPage from './pages/OrderPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pedido/:publicId" element={<OrderPage />} />
      <Route path="/:slug" element={<StoreLayout />}>
        <Route index element={<MenuPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
