import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';

interface PropertyAd {
  id: string;
  title: string;
  location: string;
  type: string;
  price: string;
  description: string;
  image: string;
}

const properties: PropertyAd[] = [
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

export default function FeaturedAdverts() {
  return (
    <View className="my-6">
      <View className="px-4 mb-4 flex-row justify-between items-center">
        <View>
          <Text className="text-xl font-bold text-gray-900">Featured Adverts 🏡</Text>
          <Text className="text-sm text-gray-500">Apartments, flats, maisonettes & bungalows</Text>
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {properties.map((item) => (
          <View 
            key={item.id} 
            className="bg-white rounded-2xl shadow-sm border border-gray-100 mr-4 w-72 overflow-hidden"
          >
            <Image source={{ uri: item.image }} className="w-full h-40" />
            
            <View className="p-4">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full overflow-hidden">
                  {item.type}
                </Text>
                <Text className="text-sm font-bold text-gray-900">{item.price}</Text>
              </View>

              <Text className="text-base font-bold text-gray-800 mb-1" numberOfLines={1}>
                {item.title}
              </Text>

              <View className="flex-row items-center mb-2">
                <Text className="text-xs text-gray-500" numberOfLines={1}>
                  📍 {item.location}
                </Text>
              </View>

              <Text className="text-xs text-gray-600 mb-4 h-10" numberOfLines={2}>
                {item.description}
              </Text>

              <TouchableOpacity className="bg-emerald-600 py-3 rounded-xl items-center justify-center shadow-sm">
                <Text className="text-white font-semibold text-xs">Book Viewing & Pay Rent</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}