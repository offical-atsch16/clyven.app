import { Card, CardContent } from "../components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#080808]">
      <Card className="w-full max-w-md mx-4 border-white/[0.07] bg-[#111111] text-white">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold">404 Page Not Found</h1>
          </div>
          <p className="text-white/60 mb-6 text-sm">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <Link href="/">
            <button className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition-colors cursor-pointer">
              Go Home
            </button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
