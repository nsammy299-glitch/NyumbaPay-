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
    type: '2-Bedroom Apartment',
    price: 'KSh 120,000 / mo',
    description: 'High-rise luxury living with open-plan kitchen and rooftop pool.',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '2',
    title: 'Capital Garden Residences',
    location: 'Kilimani (Kindaruma Rd)',
    type: '2-Bedroom Master-Ensuite',
    price: 'KSh 90,000 / mo',
    description: 'Sun-drenched apartment with private balcony and wooden flooring.',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '3',
    title: 'TRM View Executive Flats',
    location: 'Roysambu (Near TRM)',
    type: '2-Bedroom Modern Apartment',
    price: 'KSh 45,000 / mo',
    description: 'Vibrant unit with laundry balcony near Thika Road Mall.',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '4',
    title: 'Kahawa Sukari Oasis',
    location: 'Kahawa Sukari',
    type: '4-Bedroom Maisonette',
    price: 'KSh 95,000 / mo',
    description: 'Suburban luxury standalone-feel maisonette with green lawn.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '5',
    title: 'Ruiru Greenleaf Haven',
    location: 'Ruiru (Eastern Bypass)',
    type: '3-Bedroom Bungalow',
    price: 'KSh 75,000 / mo',
    description: 'Peaceful standalone bungalow on its own gated compound.',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format&fit=crop&q=80',
  },
];

export default function FeaturedAdverts() {
  return (
    <View style={{ marginVertical: 16 }}>
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Featured Adverts 🏡</Text>
        <Text style={{ fontSize: 13, color: '#6b7280' }}>Apartments, flats, maisonettes & bungalows</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {properties.map((item) => (
          <View 
            key={item.id} 
            style={{ backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', marginRight: 16, width: 280, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 }}
          >
            <Image source={{ uri: item.image }} style={{ width: '100%', height: 140 }} />
            <View style={{ padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#059669', backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' }}>
                  {item.type}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#111827' }}>{item.price}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 }} numberOfLines={1}>{item.title}</Text>
              <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>📍 {item.location}</Text>
              <Text style={{ fontSize: 11, color: '#4b5563', height: 32, marginBottom: 8 }} numberOfLines={2}>{item.description}</Text>
              <TouchableOpacity style={{ backgroundColor: '#059669', paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 11 }}>Book Viewing & Pay Rent</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}