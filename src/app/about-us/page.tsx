/**
 * About Us Page - JRM HOLISTIK Ajah (Dealer Rasmi UG 237)
 * Brand story, heritage, and values
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SEOHead from '@/components/seo/SEOHead';
import { SEOService } from '@/lib/seo/seo-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Shield,
  Award,
  Star,
  Users,
  Heart,
  Leaf,
  CheckCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function AboutUsPage() {
  // Generate SEO data for About Us page
  const seoData = SEOService.getAboutUsSEO();

  return (
    <div>
      <SEOHead seo={seoData} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 lg:px-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-green-200 mb-6">
              <Leaf className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Dealer Rasmi UG 237
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              JRM HOLISTIK Ajah
            </h1>

            <p className="text-xl md:text-2xl text-gray-700 mb-4">
              Dealer Rasmi Jamu Ratu Malaya
            </p>

            <p className="text-lg text-gray-600 leading-relaxed">
              Menawarkan produk jamu tradisional berkualiti tinggi dari{' '}
              <strong className="text-gray-900">Bonda Rozita Ibrahim</strong>,
              pengasas Sendayu Tinggi - dipercayai oleh ribuan keluarga Malaysia
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Content */}
              <div>
                <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full mb-6">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">
                    Kisah Kami
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Warisan Jamu Tradisional untuk Wanita Malaysia
                </h2>

                <div className="space-y-6 text-gray-700 leading-relaxed">
                  <p>
                    <strong className="text-gray-900">JRM HOLISTIK</strong>,
                    atau lebih dikenali sebagai{' '}
                    <strong className="text-gray-900">Jamu Ratu Malaya</strong>,
                    adalah jenama terpercaya Malaysia yang menggabungkan
                    kebijaksanaan herba tradisional dengan sains moden.
                  </p>

                  <p>
                    Dipersembahkan oleh{' '}
                    <strong className="text-gray-900">
                      Bonda Rozita Ibrahim
                    </strong>{' '}
                    - pengasas jenama terkenal Sendayu Tinggi - setiap produk
                    JRM HOLISTIK dihasilkan dengan komitmen terhadap kualiti dan
                    keaslian yang tidak berkompromi.
                  </p>

                  <p>
                    Kami bangga menjadi{' '}
                    <strong className="text-green-700">
                      Dealer Rasmi UG 237
                    </strong>
                    , menawarkan rangkaian lengkap produk jamu untuk kesihatan
                    dalaman wanita, penjagaan selepas bersalin, kecantikan kulit,
                    dan kesejahteraan umum.
                  </p>
                </div>

                <div className="mt-8 p-6 bg-green-50 border-l-4 border-green-600 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Heart className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">
                        Misi Kami
                      </p>
                      <p className="text-gray-700 text-sm">
                        Menyediakan produk jamu dan kesihatan semula jadi yang
                        berkualiti tinggi untuk wanita dan keluarga Malaysia,
                        dengan mengekalkan warisan tradisional sambil memenuhi
                        standard moden.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Brand Image */}
              <div className="relative">
                <div className="aspect-[4/3] bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl shadow-xl overflow-hidden">
                  {/*
                    To add your image:
                    1. Place your image in: public/uploads/about/brand-story.jpg
                    2. Uncomment the Image component below
                    3. Comment out or remove the placeholder div
                  */}

                  {/* Uncomment this when you add your image:
                  <Image
                    src="/uploads/about/brand-story.jpg"
                    alt="JRM HOLISTIK - Produk Jamu Ratu Malaya"
                    fill
                    className="object-cover"
                    priority
                  />
                  */}

                  {/* Placeholder - remove this when you add your image */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <Leaf className="w-20 h-20 text-green-600 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">
                        Produk JRM HOLISTIK
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        Tambah imej di: public/uploads/about/brand-story.jpg
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating Stats */}
                <div className="absolute -bottom-8 -right-8 bg-white rounded-xl shadow-2xl p-6 border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        Ribuan+
                      </div>
                      <div className="text-sm text-gray-600">
                        Pelanggan Setia
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Heritage & Quality Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Kualiti Tulen & Dipercayai
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Setiap produk Jamu Ratu Malaya dihasilkan daripada ramuan
                tradisional tulen yang telah dipercayai selama beberapa generasi
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {/* Quality Card 1 */}
              <Card className="border-green-100 hover:border-green-300 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    100% Tulen
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Ramuan tradisional berkualiti tanpa bahan kimia berbahaya
                  </p>
                </CardContent>
              </Card>

              {/* Quality Card 2 */}
              <Card className="border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <Award className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Lulus KKM
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Disahkan selamat oleh Kementerian Kesihatan Malaysia
                  </p>
                </CardContent>
              </Card>

              {/* Quality Card 3 */}
              <Card className="border-purple-100 hover:border-purple-300 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                    <Star className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    HALAL
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Pengesahan halal untuk ketenangan minda anda
                  </p>
                </CardContent>
              </Card>

              {/* Quality Card 4 */}
              <Card className="border-yellow-100 hover:border-yellow-300 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Terbukti
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Dipercayai oleh ribuan wanita di seluruh Malaysia
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Production Process Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Tradisi Bertemu Teknologi
              </h2>
              <p className="text-lg text-gray-600">
                Kami menggabungkan kearifan jamu tradisional Melayu dengan
                teknologi pembuatan moden
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 lg:p-12 border border-green-100">
              <div className="space-y-6">
                {/* Process Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      1
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Pemilihan Ramuan Berkualiti
                    </h3>
                    <p className="text-gray-700">
                      Setiap ramuan dipilih dengan teliti mengikut standard
                      tradisional yang ketat untuk memastikan kualiti terbaik.
                    </p>
                  </div>
                </div>

                {/* Process Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      2
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Pemprosesan Moden
                    </h3>
                    <p className="text-gray-700">
                      Menggunakan teknologi pembuatan terkini untuk mengekalkan
                      khasiat ramuan sambil memastikan keselamatan produk.
                    </p>
                  </div>
                </div>

                {/* Process Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Kawalan Kualiti Ketat
                    </h3>
                    <p className="text-gray-700">
                      Setiap produk melalui ujian kualiti menyeluruh untuk
                      memenuhi piawaian KKM dan Halal sebelum sampai kepada anda.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Alami Manfaat Jamu Tradisional Hari Ini
            </h2>
            <p className="text-xl text-green-50 mb-8 leading-relaxed">
              Sama ada anda mencari produk untuk kesihatan dalaman wanita,
              penjagaan selepas bersalin, kecantikan kulit, atau kesejahteraan
              umum - kami ada penyelesaian semula jadi untuk anda
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button
                  size="lg"
                  className="bg-white text-green-700 hover:bg-gray-100 shadow-xl text-lg px-8"
                >
                  Lihat Semua Produk
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>

              <Link href="/products?featured=true">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-green-700 text-lg px-8"
                >
                  Produk Popular
                </Button>
              </Link>
            </div>

            <p className="mt-8 text-sm text-green-100">
              Dealer Rasmi UG 237 | Produk 100% Tulen | Lulus KKM & Halal
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
