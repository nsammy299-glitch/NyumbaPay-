import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';

const properties = [
  {
    id: '1',
    title: 'The SkyView Executive Suites',
    location: 'Westlands (Near GTC)',
    type: '2-Bed Apt',
    price: 'KSh 120,000 / mo',
    description: 'High-rise luxury living with open-plan kitchen and heated rooftop pool.',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '2',
    title: 'Capital Garden Residences',
    location: 'Kilimani (Kindaruma Rd)',
    type: '2-Bed Master-Ensuite',
    price: 'KSh 90,000 / mo',
    description: 'Sun-drenched apartment boasting a large lounge and fine wooden flooring.',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '3',
    title: 'Lavington Green Heights',
    location: 'Lavington (Near Mall)',
    type: '3-Bed + DSQ',
    price: 'KSh 160,000 / mo',
    description: 'Elite privacy in a leafy diplomatic neighborhood featuring an expansive lounge.',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '4',
    title: 'Kileleshwa Serene Haven',
    location: 'Kileleshwa (Laikipia Rd)',
    type: '1-Bed Urban Apt',
    price: 'KSh 70,000 / mo',
    description: 'Stylish urban unit blending contemporary finishes with a private balcony.',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '5',
    title: 'TRM View Executive Flats',
    location: 'Roysambu (Near TRM)',
    type: '2-Bed Modern Apt',
    price: 'KSh 45,000 / mo',
    description: 'Vibrant unit with tiled finishes, laundry balcony, and walking distance to TRM.',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '6',
    title: 'Seasons Grand Residences',
    location: 'Kasarani (Seasons Stage)',
    type: '3-Bed Family Flat',
    price: 'KSh 50,000 / mo',
    description: 'Family-friendly apartment offering generous spaces and large lighting windows.',
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '7',
    title: 'Kahawa Sukari Oasis',
    location: 'Kahawa Sukari',
    type: '4-Bed Maisonette + DSQ',
    price: 'KSh 95,000 / mo',
    description: 'Suburban luxury standalone-feel maisonette featuring a sunken lounge and green lawn.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '8',
    title: 'Ruiru Greenleaf Haven',
    location: 'Ruiru (Eastern Bypass)',
    type: '3-Bed Standalone Bungalow',
    price: 'KSh 75,000 / mo',
    description: 'Peaceful standalone bungalow set on its own gated compound with backyard.',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format&fit=crop&q=80',
  },
];

export default function PropertiesScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Immersive Hero Header */}
      <View className="bg-[#064e3b] px-6 pt-16 pb-12 rounded-b-[40px] shadow-lg z-10">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="mb-6 self-start bg-white/20 px-4 py-2 rounded-full flex-row items-center"
        >
          <Text className="text-white font-bold text-xs">← Back to Dashboard</Text>
        </TouchableOpacity>
        
        <Text className="text-4xl font-extrabold text-white mb-2 tracking-tight">
          Discover Nairobi.
        </Text>
        <Text className="text-emerald-100 text-base font-medium">
          Find your next home in the city's finest neighborhoods.
        </Text>
      </View>

      {/* Property Feed - Pulled up over the header background */}
      <ScrollView className="px-4 -mt-6 z-20 pb-20" showsVerticalScrollIndicator={false}>
        {properties.map((item) => (
          <View 
            key={item.id} 
            className="bg-white rounded-[28px] shadow-md border border-gray-100 mb-6 overflow-hidden"
          >
            {/* Edge-to-Edge Image with Floating Elements */}
            <View className="relative">
              <Image source={{ uri: item.image }} className="w-full h-64" />
              
              {/* Floating Dark Gradient Overlay (Simulated via positioning) */}
              <View className="absolute inset-0 bg-black/10" />

              {/* Floating Type Badge */}
              <View className="absolute top-4 right-4 bg-white/95 px-3 py-1.5 rounded-full shadow-sm">
                <Text className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest">
                  {item.type}
                </Text>
              </View>

              {/* Floating Price Tag */}
              <View className="absolute bottom-4 left-4 bg-gray-900/90 px-4 py-2 rounded-2xl">
                <Text className="text-white font-extrabold text-lg tracking-wide">
                  {item.price}
                </Text>
              </View>
            </View>
            
            {/* Clean, Minimalist Text Container */}
            <View className="p-5">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-xl font-extrabold text-gray-900 flex-1 mr-2" numberOfLines={1}>
                  {item.title}
                </Text>
              </View>

              <Text className="text-sm font-semibold text-gray-400 mb-3">
                📍 {item.location}
              </Text>

              <Text className="text-sm text-gray-600 leading-relaxed mb-5">
                {item.description}
              </Text>

              <TouchableOpacity className="bg-emerald-600 py-4 rounded-2xl items-center justify-center shadow-sm flex-row">
                <Text className="text-white font-bold text-sm tracking-wide">
                  Secure This Property
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View className="h-12" />
      </ScrollView>
    </View>
  );
}