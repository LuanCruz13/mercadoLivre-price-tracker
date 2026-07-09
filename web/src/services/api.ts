import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3001", // A porta onde o seu back-end está rodando
});