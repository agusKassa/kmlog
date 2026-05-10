'use client'

import { useState, useEffect } from 'react'

const QUOTES = [
  { text: 'All we have to decide is what to do with the time that is given us.', character: 'Gandalf', work: 'El Señor de los Anillos' },
  { text: 'Even the smallest person can change the course of the future.', character: 'Galadriel', work: 'El Señor de los Anillos' },
  { text: "I can't carry it for you, but I can carry you!", character: 'Samwise Gamgee', work: 'El Señor de los Anillos' },
  { text: 'Not all those who wander are lost.', character: 'Bilbo Bolsón', work: 'El Señor de los Anillos' },
  { text: "There's some good in this world, Mr. Frodo, and it's worth fighting for.", character: 'Samwise Gamgee', work: 'El Señor de los Anillos' },
  { text: 'I am looking for someone to share in an adventure that I am arranging.', character: 'Gandalf', work: 'El Hobbit' },
  { text: 'Do or do not. There is no try.', character: 'Yoda', work: 'Star Wars' },
  { text: 'The Force will be with you. Always.', character: 'Obi-Wan Kenobi', work: 'Star Wars' },
  { text: 'In my experience, there is no such thing as luck.', character: 'Obi-Wan Kenobi', work: 'Star Wars' },
  { text: 'Your focus determines your reality.', character: 'Qui-Gon Jinn', work: 'Star Wars' },
  { text: 'It is our choices that show what we truly are, far more than our abilities.', character: 'Albus Dumbledore', work: 'Harry Potter' },
  { text: 'Happiness can be found even in the darkest of times, if one only remembers to turn on the light.', character: 'Albus Dumbledore', work: 'Harry Potter' },
  { text: 'It does not do to dwell on dreams and forget to live.', character: 'Albus Dumbledore', work: 'Harry Potter' },
  { text: 'We are only as strong as we are united, as weak as we are divided.', character: 'Albus Dumbledore', work: 'Harry Potter' },
  { text: 'I must not fear. Fear is the mind-killer. Fear is the little death that brings total obliteration.', character: 'Paul Atreides', work: 'Dune' },
  { text: 'The mystery of life is not a problem to solve, but a reality to experience.', character: 'Frank Herbert', work: 'Dune' },
  { text: 'When you play the game of thrones, you win or you die.', character: 'Cersei Lannister', work: 'Game of Thrones' },
  { text: 'The man who passes the sentence should swing the sword.', character: 'Eddard Stark', work: 'Game of Thrones' },
  { text: 'A reader lives a thousand lives before he dies. The man who never reads lives only one.', character: 'Jojen Reed', work: 'Game of Thrones' },
  { text: 'Evil is evil. Lesser, greater, middling — it makes no difference. The degree is arbitary, the definitions blurred.', character: 'Geralt de Rivia', work: 'The Witcher' },
  { text: "If I'm to choose between one evil and another, I'd rather not choose at all.", character: 'Geralt de Rivia', work: 'The Witcher' },
  { text: "Course he isn't safe. But he's good. He's the King, I tell you.", character: 'Sr. Castor', work: 'Las Crónicas de Narnia' },
  { text: 'To the well-organized mind, death is but the next great adventure.', character: 'Albus Dumbledore', work: 'Harry Potter' },
  { text: 'Home is behind, the world ahead, and there are many paths to tread.', character: 'Pippin Tuk', work: 'El Señor de los Anillos' },
  { text: 'Wars are not won by fighting battles; wars are won by choosing battles.', character: 'George R.R. Martin', work: 'A Song of Ice and Fire' },
]

export function LoginQuote() {
  const [quote, setQuote] = useState(QUOTES[0])

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
  }, [])

  return (
    <div className="text-center">
      <p className="font-body mx-auto max-w-[300px] text-[1.05rem] italic leading-[1.85] text-stone-300">
        &ldquo;{quote.text}&rdquo;
      </p>
      <div className="mt-4 flex flex-col items-center gap-0.5">
        <span className="font-display text-[0.72rem] font-semibold tracking-[0.1em] text-amber-500">
          {quote.character}
        </span>
        <span className="text-[0.62rem] uppercase tracking-[0.15em] text-stone-600">
          {quote.work}
        </span>
      </div>
    </div>
  )
}
