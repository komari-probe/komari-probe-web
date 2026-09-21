import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import React from "react";

const Index = lazy(() => import("./features/overview/OverviewPage"));
const NotFound = lazy(() => import("@/shared/ui/NotFoundPage"));

export const themeRoutes: RouteObject[] = [{ path: "/", element: React.createElement(lazy(() => import("./layout/PublicLayout"))), children: [{ index: true, element: React.createElement(Index) }, { path: "instance/:uuid", element: React.createElement(lazy(() => import("./features/instance"))) }, { path: "plugin/:short/*", element: React.createElement(lazy(() => import("./features/plugin-page/PluginPage"))) }] }, { path: "*", element: React.createElement(NotFound) }];
