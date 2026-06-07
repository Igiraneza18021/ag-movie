"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, Home as HomeIcon } from "lucide-react"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie } from "@/lib/types"

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [backgroundMovies, setBackgroundMovies] = useState<Movie[]>([])
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    async function fetchBackgroundContent() {
      try {
        const { data } = await supabase
          .from("movies")
          .select("id, poster_path")
          .eq("status", "active")
          .limit(40)
        
        if (data) {
          const repeated = [...data, ...data, ...data].slice(0, 60)
          setBackgroundMovies(repeated as any)
        }
      } catch (error) {
        console.error("Error fetching background content:", error)
      }
    }
    fetchBackgroundContent()
  }, [supabase])

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      toast.success("Check your email for the verification code!")
      router.push(`/verify?email=${encodeURIComponent(values.email)}&type=signup`)
    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Top Right Home Button */}
      <div className="absolute top-6 right-6 z-50">
        <Link href="/">
          <Button variant="ghost" className="bg-black/20 hover:bg-white/10 text-white rounded-full px-6 border border-white/10 backdrop-blur-md font-black uppercase tracking-widest text-xs transition-all active:scale-95">
            <HomeIcon className="mr-2 h-4 w-4" />
            Home
          </Button>
        </Link>
      </div>

      {/* Cinematic Background Poster Grid */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        <div 
          className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 p-4 scale-125 -rotate-12 -translate-y-[10%] -translate-x-[5%]"
          style={{ width: '120%', height: '120%' }}
        >
          {backgroundMovies.map((movie, i) => (
            <div key={`${movie.id}-${i}`} className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-2xl border border-white/5">
              <img
                src={getTMDBImageUrl(movie.poster_path, "w200")}
                alt=""
                className="object-cover w-full h-full grayscale-[0.4]"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
      </div>

      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0071eb]/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0071eb]/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="w-full max-w-md z-10">
        <div className="flex justify-center mb-12">
          <Link href="/" className="flex flex-col items-center gap-4 group">
            <Image
              src="/image.png"
              alt="Agasobanuye Movies Logo"
              width={100}
              height={100}
              className="object-contain drop-shadow-[0_0_30px_rgba(0,113,235,0.4)] group-hover:scale-110 transition-transform duration-500"
            />
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
              Agasobanuye <span className="text-[#0071eb]">Movies</span>
            </h1>
          </Link>
        </div>

        <div className="space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
              Create Account
            </h2>
            <p className="text-zinc-400 font-bold text-lg">
              Join the ultimate Agasobanuye community today
            </p>
          </div>

          <div className="grid gap-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control= {form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-bold uppercase text-[10px] tracking-widest ml-1">Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="name@example.com" 
                          {...field} 
                          className="h-14 bg-white/10 border-white/10 backdrop-blur-md rounded-2xl focus:border-[#0071eb] focus:bg-white/15 transition-all text-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-bold uppercase text-[10px] tracking-widest ml-1">Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="h-14 bg-white/10 border-white/10 backdrop-blur-md rounded-2xl focus:border-[#0071eb] focus:bg-white/15 transition-all text-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-bold uppercase text-[10px] tracking-widest ml-1">Confirm Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="h-14 bg-white/10 border-white/10 backdrop-blur-md rounded-2xl focus:border-[#0071eb] focus:bg-white/15 transition-all text-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-14 bg-[#0071eb] hover:bg-[#0071eb]/90 text-white font-black uppercase tracking-wide rounded-2xl shadow-[0_10px_30px_rgba(0,113,235,0.4)] transition-all active:scale-95 disabled:opacity-70 text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center pt-4">
              <p className="text-zinc-400 text-lg font-bold">
                Already have an account?{" "}
                <Link 
                  href="/login"
                  className="text-[#0071eb] hover:underline font-black uppercase tracking-tight"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-black pointer-events-none">
          &copy; {new Date().getFullYear()} Agasobanuye Movies &bull; All Rights Reserved
        </p>
      </div>
    </div>
  )
}
