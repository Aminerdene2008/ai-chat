'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import CharacterPicker from '../components/CharacterPicker';
import ChatInterface from '../components/ChatInterface';

interface Character {
  id: string;
  name: string;
  description: string;
  image: string;
  basePrompt: string;
  greetingText: string;
}

export default function Home() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
    router.push(`/?character=${character.id}`);
  };

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch('/api/character');
        const data = await response.json();
        setCharacters(data);
      } catch (error) {
        console.error('Failed to fetch characters:', error);
      }
    };

    fetchCharacters();
  }, []);

  useEffect(() => {
    console.log('useEffect triggered: searchParams, characters');
    const characterId = searchParams.get('character');
    if (characterId && characters.length > 0) {
      const character = characters.find(c => c.id === characterId);
      if (character && selectedCharacter?.id !== character.id) {
        console.log('Setting selectedCharacter to:', character.name);
        setSelectedCharacter(character);
      } else {
        console.log('Character already selected or not found');
      }
    } else if (!characterId && selectedCharacter) {
      console.log('Clearing selectedCharacter');
      setSelectedCharacter(null);
    }
  }, [searchParams, characters]);

  return (
    <div className="h-screen flex-col" style={{
      background: `linear-gradient(rgba(144, 238, 144, 0.4), rgba(144, 238, 144, 0.4)), url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundBlendMode: 'multiply'
    }}>
      {!selectedCharacter ? (
        <div className="flex-1 flex flex-col justify-center items-center w-screen">

            <CharacterPicker
              onCharacterSelect={handleCharacterSelect}
              selectedCharacterId={undefined}
            />

        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex-shrink-0 flex justify-between items-center p-6 border-b bg-white/80 backdrop-blur-sm shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-full relative">
                <Image
                  src={selectedCharacter.image}
                  alt={selectedCharacter.name}
                  fill
                  sizes="48px"
                  className="rounded-full object-cover shadow-md"
                />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Chat with {selectedCharacter.name}</h2>
            </div>
            <button
              onClick={() => {
                setSelectedCharacter(null);
                router.push('/');
              }}
              className="px-6 py-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg hover:from-gray-300 hover:to-gray-400 transition-all duration-200 shadow-sm"
            >
              Change Character
            </button>
          </div>
          <div className="flex-1 p-6">
            <ChatInterface character={selectedCharacter} />
          </div>
        </div>
      )}
    </div>
  );
}
