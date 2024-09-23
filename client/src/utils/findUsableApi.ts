import axios from 'axios';

let mainEndpoint = "https://appnode.qortal.org"

export const getMainEndpoint = () => mainEndpoint;
export const setMainEndpoint = (newUrl: string) => {
  mainEndpoint = newUrl;
};
