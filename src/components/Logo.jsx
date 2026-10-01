// Logo del pulpo en dos capas (public/logo-barra-color.png y -trazo.png):
// los trazos toman el color del texto del tema (oscuros en tema claro, claros
// en tema oscuro) y las partes de color (gorro, sombras) se mantienen. El fondo
// es transparente, así que se adapta a cualquier tema.
//   variant="barra"   pulpo pequeño, para la barra superior (decorativo)
//   variant="inicio"  pulpo grande con el nombre "SLAP SLAP" en texto, para el login
export default function Logo({ variant = 'barra' }) {
  const pulpo = <span className={`logo logo--${variant}`} aria-hidden="true" />
  if (variant !== 'inicio') return pulpo
  return (
    <><div className="logo-inicio">
      {pulpo}
    </div></>
  )
}
