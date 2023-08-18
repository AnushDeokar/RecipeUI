import Image from 'next/image'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import yc from '@/images/logos/yc.svg'
import { useRouter } from 'next/router'
import Cookie from 'js-cookie'

export function Hero() {
  const router = useRouter()
  return (
    <Container className="bg-black pb-16 pt-20 text-center lg:pt-32">
      <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-white marker:sm:text-7xl">
        The API tool for teams
      </h1>
      <p className="mx-auto mt-6 max-w-3xl text-lg tracking-tight text-slate-300">
        RecipeUI is an open source Postman alternative. <br />
        Built for everyone from Devs to PMs to QA. <br /> Test APIs with a click
        of a button. <br />
      </p>
      <div className="mt-10 flex justify-center gap-x-6">
        <Button
          color="white"
          className="text-[black]"
          onClick={() => {
            Cookie.set('showApp', 'true', { domain: '.recipeui.com' })
            setTimeout(() => {
              router.push('https://recipeui.com/')
            }, 500)
          }}
        >
          Explore our API network
        </Button>
        <Button variant="outline" className="text-white">
          Book a demo
        </Button>
      </div>
      <div className="mt-10 flex items-center justify-center">
        <Image src={yc} alt="backed by yc" unoptimized className="w-40" />

        {/* {[
            [
              { name: 'Transistor', logo: logoTransistor },
              { name: 'Tuple', logo: logoTuple },
              { name: 'StaticKit', logo: logoStaticKit },
            ],
            [
              { name: 'Mirage', logo: logoMirage },
              { name: 'Laravel', logo: logoLaravel },
              { name: 'Statamic', logo: logoStatamic },
            ],
          ].map((group, groupIndex) => (
            <li key={groupIndex}>
              <ul
                role="list"
                className="flex flex-col items-center gap-y-8 sm:flex-row sm:gap-x-12 sm:gap-y-0"
              >
                {group.map((company) => (
                  <li key={company.name} className="flex">
                    <Image src={company.logo} alt={company.name} unoptimized />
                  </li>
                ))}
              </ul>
            </li>
          ))} */}
      </div>
    </Container>
  )
}
