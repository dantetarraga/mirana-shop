import { describe, expect, it } from 'vitest'
import {
  isChildChecked,
  parentCheckState,
  toggleChild,
  toggleParent,
} from './category-filter'

const KIDS = ['star-wars', 'technic', 'harry-potter']

describe('parentCheckState', () => {
  it('padre en la selección → marcado', () => {
    expect(parentCheckState(['lego'], 'lego', KIDS)).toBe('checked')
  })
  it('algunas hijas → indeterminado', () => {
    expect(parentCheckState(['technic'], 'lego', KIDS)).toBe('indeterminate')
  })
  it('ninguna → desmarcado', () => {
    expect(parentCheckState(['anime'], 'lego', KIDS)).toBe('unchecked')
  })
})

describe('toggleParent', () => {
  it('marca la rama reemplazando hijas sueltas por el padre', () => {
    expect(toggleParent(['anime', 'technic'], 'lego', KIDS)).toEqual(['anime', 'lego'])
  })
  it('desmarca la rama entera', () => {
    expect(toggleParent(['lego', 'anime'], 'lego', KIDS)).toEqual(['anime'])
  })
})

describe('toggleChild', () => {
  it('agrega una hija', () => {
    expect(toggleChild([], 'lego', KIDS, 'technic')).toEqual(['technic'])
  })
  it('con el padre marcado, quitar una hija deja las demás', () => {
    expect(toggleChild(['lego'], 'lego', KIDS, 'technic')).toEqual(['star-wars', 'harry-potter'])
  })
  it('completar todas las hijas colapsa al padre', () => {
    expect(toggleChild(['star-wars', 'technic'], 'lego', KIDS, 'harry-potter')).toEqual(['lego'])
  })
  it('isChildChecked hereda del padre', () => {
    expect(isChildChecked(['lego'], 'lego', 'technic')).toBe(true)
    expect(isChildChecked([], 'lego', 'technic')).toBe(false)
  })
})
