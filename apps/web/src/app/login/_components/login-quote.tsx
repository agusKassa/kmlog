'use client'

import { useState, useEffect } from 'react'

const QUOTES = [
  { text: 'Todo lo que tenemos que decidir es qué hacer con el tiempo que nos fue dado.', character: 'Gandalf', work: 'El Señor de los Anillos' },
  { text: 'Hasta la persona más pequeña puede cambiar el curso del futuro.', character: 'Galadriel', work: 'El Señor de los Anillos' },
  { text: 'No puedo cargarlo por ti, pero puedo cargarte a ti.', character: 'Samwise Gamgee', work: 'El Señor de los Anillos' },
  { text: 'No todos los que vagan están perdidos.', character: 'Bilbo Bolsón', work: 'El Señor de los Anillos' },
  { text: 'Hay algo bueno en este mundo, señor Frodo, y vale la pena luchar por ello.', character: 'Samwise Gamgee', work: 'El Señor de los Anillos' },
  { text: 'El hogar queda atrás, el mundo por delante, y hay muchos caminos por recorrer.', character: 'Pippin Tuk', work: 'El Señor de los Anillos' },
  { text: 'Busco a alguien con quien compartir una aventura que estoy organizando.', character: 'Gandalf', work: 'El Hobbit' },
  { text: 'Hazlo o no lo hagas. No existe el intentar.', character: 'Yoda', work: 'Star Wars' },
  { text: 'La Fuerza estará contigo. Siempre.', character: 'Obi-Wan Kenobi', work: 'Star Wars' },
  { text: 'En mi experiencia, la suerte no existe.', character: 'Obi-Wan Kenobi', work: 'Star Wars' },
  { text: 'Tu enfoque determina tu realidad.', character: 'Qui-Gon Jinn', work: 'Star Wars' },
  { text: 'Son nuestras decisiones las que muestran lo que verdaderamente somos, mucho más que nuestras habilidades.', character: 'Albus Dumbledore', work: 'Harry Potter' },
  { text: 'La felicidad puede hallarse incluso en los momentos más oscuros, si uno recuerda encender la luz.', character: 'Albus Dumbledore', work: 'Harry Potter' },
  { text: 'No sirve de nada aferrarse a los sueños y olvidarse de vivir.', character: 'Albus Dumbledore', work: 'Harry Potter' },
  { text: 'Para una mente bien organizada, la muerte no es más que la siguiente gran aventura.', character: 'Albus Dumbledore', work: 'Harry Potter' },
  { text: 'Solo somos tan fuertes como lo estamos unidos, tan débiles como lo estamos divididos.', character: 'Albus Dumbledore', work: 'Harry Potter' },
  { text: 'No debo temer. El miedo es el asesino de la mente. El miedo es la pequeña muerte que conduce a la destrucción total.', character: 'Paul Atreides', work: 'Dune' },
  { text: 'El misterio de la vida no es un problema por resolver, sino una realidad por experimentar.', character: 'Frank Herbert', work: 'Dune' },
  { text: 'Cuando juegas al juego de tronos, ganas o mueres.', character: 'Cersei Lannister', work: 'Game of Thrones' },
  { text: 'El hombre que dicta la sentencia debe blandir la espada.', character: 'Eddard Stark', work: 'Game of Thrones' },
  { text: 'Un lector vive mil vidas antes de morir. El hombre que nunca lee vive solo una.', character: 'Jojen Reed', work: 'Game of Thrones' },
  { text: 'El mal es el mal. Menor, mayor, mediocre — la diferencia es arbitraria, las definiciones difusas.', character: 'Geralt de Rivia', work: 'The Witcher' },
  { text: 'Si debo elegir entre un mal y otro, prefiero no elegir en absoluto.', character: 'Geralt de Rivia', work: 'The Witcher' },
  { text: 'Claro que no es manso. Pero es bueno. Es el Rey, te digo.', character: 'Señor Castor', work: 'Las Crónicas de Narnia' },
]

export function LoginQuote() {
  const [quote, setQuote] = useState(QUOTES[0])

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
  }, [])

  return (
    <div className="mx-auto max-w-[300px] text-left">
      <p className="font-body text-[1.15rem] italic leading-[1.9] text-stone-300">
        &ldquo;{quote.text}&rdquo;
      </p>
      <div className="mt-5 text-right">
        <span className="font-body text-[0.88rem] text-stone-400">
          &mdash; {quote.character},&nbsp;
        </span>
        <span className="font-body text-[0.82rem] italic text-stone-600">
          {quote.work}
        </span>
      </div>
    </div>
  )
}
