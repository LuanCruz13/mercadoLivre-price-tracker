import axios from "axios";

console.log("URL BASE CARREGADA:", process.env.NEXT_PUBLIC_API_URL);

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});