// "use client";

// import {
//   RecipeSession,
//   useRecipeSessionStore,
// } from "../../state/recipeSession";
// import { useEffect, useRef, useState } from "react";
// import { useParams, usePathname, useRouter } from "next/navigation";
// import classNames from "classnames";
// import { getURLParamsForSession } from "../../utils/main";
// import { RouteTypeLabel } from "../RouteTypeLabel";
// import { useHover } from "usehooks-ts";
// import { useIsMobile } from "../../hooks";
// import { XMarkIcon } from "@heroicons/react/24/outline";
// import { RecipeHomeSidebar } from "./RecipeHomeSidebar";
// import { useIsTauri } from "../../hooks/useIsTauri";

// export function RecipeSidebar() {
//   const sessions = useRecipeSessionStore((state) => state.sessions);
//   const setSessions = useRecipeSessionStore((state) => state.setSessions);
//   const currentSession = useRecipeSessionStore((state) => state.currentSession);
//   const setCurrentSession = useRecipeSessionStore(
//     (state) => state.setCurrentSession
//   );
//   const router = useRouter();
//   const isTauri = useIsTauri();

//   useEffect(() => {
//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (event.metaKey || event.ctrlKey) {
//         if (
//           ["ArrowDown", "ArrowUp"].includes(event.key) &&
//           sessions.length > 1
//         ) {
//           event.preventDefault();

//           router.push("/");

//           if (!currentSession) return setCurrentSession(sessions[0]);

//           const currentIndex = sessions.findIndex(
//             (session) => session.id === currentSession.id
//           );

//           const changeFactor = event.key === "ArrowDown" ? 1 : -1;
//           const nextIndex = (currentIndex + changeFactor) % sessions.length;

//           const nextSession = sessions[nextIndex];
//           router.push(`/?${getURLParamsForSession(nextSession)}`);
//           setCurrentSession(sessions[nextIndex]);
//         }
//       }
//     };
//     window.addEventListener("keydown", handleKeyDown);

//     // Remove the keydown event listener when the component unmounts
//     return () => {
//       window.removeEventListener("keydown", handleKeyDown);
//     };
//   }, [currentSession, sessions, setCurrentSession]);

//   const pathname = usePathname();

//   const isMobile = useIsMobile();
//   useEffect(() => {
//     if (isMobile && currentSession && sessions.length > 1) {
//       setSessions([currentSession]);
//     }
//   }, [currentSession, isMobile, sessions, setCurrentSession, setSessions]);

//   if (sessions.length === 0 || pathname === "/new" || currentSession === null) {
//     return <RecipeHomeSidebar />;
//   }

//   return (
//     <div className="hidden sm:block w-56 border-r border-r-slate-200 dark:border-r-slate-600">
//       <button
//         className="text-start py-2 pt-3 w-full"
//         onClick={() => {
//           setCurrentSession(null);

//           if (!isTauri) {
//             router.push("/");
//           }
//         }}
//       >
//         <h3 className="font-bold text-sm ml-4 cursor-pointer w-full  justify-start p-0 text-start">
//           <span className="tooltip tooltip-right" data-tip="CMD+K">
//             Home
//           </span>
//         </h3>
//       </button>
//       <div className="text-start py-2 w-full">
//         <h3 className="font-bold text-sm ml-4">Sessions</h3>
//       </div>
//       <div>
//         {sessions.length >= 10 && (
//           <div className="px-4 py-2 text-xs w-full text-start relative flex bg-warning dark:text-black animate-pulse">
//             Having 10 or more sessions is not recommended. Consider closing some
//             and take advantage of recipes instead.
//           </div>
//         )}

//         {sessions.map((session) => {
//           const isCurrentSession = currentSession?.id === session.id;

//           return (
//             <SessionTab
//               key={session.id}
//               session={session}
//               isCurrentSession={isCurrentSession}
//             />
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// function SessionTab({
//   isCurrentSession,
//   session,
// }: {
//   isCurrentSession: boolean;
//   session: RecipeSession;
// }) {
//   const hoverRef = useRef(null);
//   const isHover = useHover(hoverRef);
//   const setCurrentSession = useRecipeSessionStore(
//     (state) => state.setCurrentSession
//   );
//   const updateSessionName = useRecipeSessionStore(
//     (state) => state.updateSessionName
//   );
//   const closeSession = useRecipeSessionStore((state) => state.closeSession);

//   const [isEditing, setIsEditing] = useState(false);
//   const [name, setName] = useState(session.name);

//   const onUpdateSessionName = () => {
//     setIsEditing(false);
//     updateSessionName(session, name);
//   };
//   const router = useRouter();
//   const isTauri = useIsTauri();

//   return (
//     <button
//       ref={hoverRef}
//       key={session.id}
//       className={classNames(
//         "px-4 py-2 text-xs w-full text-start relative flex",
//         isCurrentSession && "bg-gray-400 text-white"
//       )}
//       onClick={() => {
//         if (!isCurrentSession) {
//           setCurrentSession(session);

//           if (!isTauri) {
//             router.push(
//               `/?${new URLSearchParams(
//                 getURLParamsForSession(session)
//               ).toString()}`
//             );
//           }
//           return;
//         }
//         if (!isEditing) {
//           setIsEditing(true);
//           return;
//         }
//       }}
//     >
//       <RouteTypeLabel size="small" recipeMethod={session.recipeMethod} />
//       {isEditing ? (
//         <input
//           className="text-black outline-none ml-2 dark:text-white dark:bg-neutral-900 w-full"
//           onBlur={onUpdateSessionName}
//           onKeyDown={(e) => {
//             if (e.key === "Enter") onUpdateSessionName();
//           }}
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//         />
//       ) : (
//         <h4 className="ml-2">{session.name}</h4>
//       )}
//       {isCurrentSession && (
//         <div className="absolute top-0 left-0 bottom-0 bg-gray-600 w-1" />
//       )}
//       {isHover && !isEditing && (
//         <div
//           className="absolute right-0 top-0 bottom-0 flex w-8 justify-center items-center  hover:bg-red-600 hover:text-white cursor-pointer"
//           onClick={(e) => {
//             e.stopPropagation();
//             closeSession(session);
//           }}
//         >
//           <XMarkIcon className="w-4 h-4" />
//         </div>
//       )}
//     </button>
//   );
// }
