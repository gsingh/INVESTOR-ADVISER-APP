import { createRoute } from '@tanstack/react-router'
import { lazy } from 'react'
import { rootRoute } from './routes/__root'

const Dashboard = lazy(() => import('./routes/index'))
const Profiling = lazy(() => import('./routes/profiling/index'))
const Goals = lazy(() => import('./routes/goals/index'))
const NewGoal = lazy(() => import('./routes/goals/new'))
const GoalDetail = lazy(() => import('./routes/goals/$goalId'))
const UniverseBrowser = lazy(() => import('./routes/universe-browser/index'))
const Scorecard = lazy(() => import('./routes/scorecard/index'))
const FundDetail = lazy(() => import('./routes/scorecard/$schemeCode'))
const Portfolio = lazy(() => import('./routes/portfolio/index'))
const Reviews = lazy(() => import('./routes/reviews/index'))
const Journal = lazy(() => import('./routes/journal/index'))
const Settings = lazy(() => import('./routes/settings/index'))

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
})

const profilingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profiling',
  component: Profiling,
})

const goalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/goals',
  component: Goals,
})

const newGoalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/goals/new',
  component: NewGoal,
})

const goalDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/goals/$goalId',
  component: GoalDetail,
})

const universeBrowserRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/universe-browser',
  component: UniverseBrowser,
})

const scorecardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scorecard',
  component: Scorecard,
})

const fundDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scorecard/$schemeCode',
  component: FundDetail,
})

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/portfolio',
  component: Portfolio,
})

const reviewsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reviews',
  component: Reviews,
})

const journalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/journal',
  component: Journal,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: Settings,
})

export const routeTree = rootRoute.addChildren([
  dashboardRoute,
  profilingRoute,
  goalsRoute,
  newGoalRoute,
  goalDetailRoute,
  universeBrowserRoute,
  scorecardRoute,
  fundDetailRoute,
  portfolioRoute,
  reviewsRoute,
  journalRoute,
  settingsRoute,
])
