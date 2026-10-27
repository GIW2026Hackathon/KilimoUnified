"use client";

import { useMutation } from "@tanstack/react-query";
import { login, registerAccount } from "@/lib/api/auth";

export const useLogin = () => useMutation({ mutationFn: login });
export const useRegister = () => useMutation({ mutationFn: registerAccount });