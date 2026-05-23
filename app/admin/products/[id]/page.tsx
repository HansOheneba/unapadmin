"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/products/product-form";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const product = useAdminStore((s) =>
    s.products.find((p) => p.id === params.id),
  );

  if (!product) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/admin/products")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="p-12 text-center text-zinc-500">
            Product not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ProductForm initial={product} />;
}
