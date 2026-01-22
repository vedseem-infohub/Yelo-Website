"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Truck, CheckCircle, Eye } from "lucide-react";
import { orderAPI } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import PageWrapper from "@/components/common/PageWrapper";

export default function OrdersPage() {
  const router = useRouter();
  const { backendUser, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (authLoading || !backendUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await orderAPI.getAll();
        
        if (response.success) {
          setOrders(response.data || []);
        } else {
          setError(response.message || "Failed to fetch orders");
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [backendUser, authLoading]);

  return (
    <PageWrapper showLoader={false}>
      <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
            <p className="text-sm text-gray-500">Track and manage your orders</p>
          </div>
        </div>
      </div>

      {/* Orders Content */}
      <div className="px-4 py-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl transition-all"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No orders yet
            </h2>
            <p className="text-gray-500 text-center mb-6">
              When you place an order, it will appear here
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-xl transition-all"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const orderDate = new Date(order.createdAt || order.dateAdded);
              const formattedDate = orderDate.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return (
                <Link
                  key={order._id || order.id}
                  href={`/orders/${order._id || order.id}`}
                  className="block bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Order ID</p>
                      <p className="font-semibold text-gray-900">#{order._id?.toString().slice(-8) || order.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Ordered on</p>
                      <p className="font-semibold text-gray-900">{formattedDate}</p>
                    </div>
                  </div>

                  {/* Order Status */}
                  <div className="flex items-center gap-2 mb-4">
                    {order.orderStatus === "DELIVERED" ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : order.orderStatus === "SHIPPED" ? (
                      <Truck className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Package className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className="font-medium text-gray-900 capitalize">
                      {order.orderStatus?.toLowerCase() || order.status?.toLowerCase() || "Placed"}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2 mb-4">
                    {order.items?.map((item, index) => {
                      const product = item.productId || item;
                      const productName = typeof product === 'object' ? product.name : item.name;
                      const productImages = typeof product === 'object' ? (product.images || []) : [];
                      const imageUrl = productImages[0]?.url || productImages[0] || '';

                      return (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                            {imageUrl ? (
                              <img src={imageUrl} alt={productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{productName}</p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity} • ₹{item.price || item.priceAtAdd || 0}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Total */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-gray-700">Total</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-gray-900">
                        ₹{order.totalAmount || order.total || 0}
                      </span>
                      <Eye className="w-5 h-5 text-yellow-500" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </PageWrapper>
  );
}

