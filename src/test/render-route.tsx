import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'

/** 앱 경로표 그대로 주소 하나를 그린다. state는 navigate(..., { state })로 넘어온 값 */
export function renderRoute(path: string, state?: unknown) {
  const { pathname, search } = new URL(path, 'http://localhost')
  const router = createMemoryRouter(routes, {
    initialEntries: [state === undefined ? path : { pathname, search, state }],
  })
  return { router, ...render(<RouterProvider router={router} />) }
}
