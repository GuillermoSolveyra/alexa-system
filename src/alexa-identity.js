import fs from "fs";
import path from "path";

const PATH = path.join(process.cwd(), "data", "identity.json");

const IDENTIDAD_BASE = {
    nombreIA: null,
    generoIA: null,
    formaTrato: null,
    nombreUsuario: null
};

export function cargarIdentidad() {
    if (!fs.existsSync(PATH)) {
        return { ...IDENTIDAD_BASE };
    }

    try {
        const data = JSON.parse(fs.readFileSync(PATH, "utf-8"));
        return { ...IDENTIDAD_BASE, ...data };
    } catch {
        return { ...IDENTIDAD_BASE };
    }
}

export function guardarIdentidad(data) {
    const identidad = { ...IDENTIDAD_BASE, ...data };

    fs.mkdirSync(path.dirname(PATH), { recursive: true });
    fs.writeFileSync(PATH, JSON.stringify(identidad, null, 2));
}