/**
 * Pixel icons from pixelarticons (MIT), drawn as a CSS mask so they take the text colour.
 * Only the icons listed here are bundled.
 */
import coin from 'pixelarticons/svg/money.svg'
import wallet from 'pixelarticons/svg/wallet.svg'
import calendar from 'pixelarticons/svg/calendar.svg'
import mail from 'pixelarticons/svg/mail.svg'
import message from 'pixelarticons/svg/message.svg'
import home from 'pixelarticons/svg/home.svg'
import building from 'pixelarticons/svg/building.svg'
import sun from 'pixelarticons/svg/sun.svg'
import moon from 'pixelarticons/svg/moon.svg'
import heart from 'pixelarticons/svg/heart.svg'
import shield from 'pixelarticons/svg/shield.svg'
import lock from 'pixelarticons/svg/lock.svg'
import check from 'pixelarticons/svg/check.svg'
import close from 'pixelarticons/svg/close.svg'
import arrowUp from 'pixelarticons/svg/arrow-up.svg'
import arrowDown from 'pixelarticons/svg/arrow-down.svg'
import arrowLeft from 'pixelarticons/svg/arrow-left.svg'
import arrowRight from 'pixelarticons/svg/arrow-right.svg'
import zap from 'pixelarticons/svg/zap.svg'
import user from 'pixelarticons/svg/user.svg'
import users from 'pixelarticons/svg/users.svg'
import clock from 'pixelarticons/svg/clock.svg'
import reload from 'pixelarticons/svg/reload.svg'
import search from 'pixelarticons/svg/search.svg'
import gift from 'pixelarticons/svg/gift.svg'
import store from 'pixelarticons/svg/store.svg'
import briefcase from 'pixelarticons/svg/briefcase.svg'
import card from 'pixelarticons/svg/credit-card.svg'
import play from 'pixelarticons/svg/play.svg'
import book from 'pixelarticons/svg/book-open.svg'
import settings from 'pixelarticons/svg/sliders.svg'
import map from 'pixelarticons/svg/map.svg'

export const ICONS = { coin, wallet, calendar, mail, message, home, building, sun, moon, heart, shield, lock, check, close, arrowUp, arrowDown, arrowLeft, arrowRight, zap, user, users, clock, reload, search, gift, store, briefcase, card, play, book, settings, map }
export type IconName = keyof typeof ICONS

/** 24-unit grid icons; size should be a multiple of 12 so the pixels stay whole. */
export function PxIcon({ name, size = 24, className = '', label }: { name: IconName; size?: 12 | 24 | 36 | 48; className?: string; label?: string }) {
  const url = `url("${ICONS[name]}")`
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-block shrink-0 bg-current align-middle ${className}`}
      style={{ width: size, height: size, WebkitMaskImage: url, maskImage: url, WebkitMaskSize: '100% 100%', maskSize: '100% 100%', imageRendering: 'pixelated' }}
    />
  )
}
