import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FieldCard from '../../src/components/FieldCard.vue'

// Mock the api module
vi.mock('../../src/utils/api', () => ({
  api: {
    patch: vi.fn()
  }
}))

describe('FieldCard Component', () => {
  const mockField = {
    id: 1,
    farmId: 1,
    fieldNumber: 1,
    name: 'Test Field',
    sizeHectares: 12.5,
    currentCrop: 'Wheat',
    growthStage: 'Growing',
    fertiliserState: 'Stage 1',
    weedsState: 'None',
    notes: 'Test notes',
    updatedAt: new Date().toISOString()
  }

  it('should show field name from props', () => {
    const wrapper = mount(FieldCard, {
      props: {
        field: mockField
      }
    })

    expect(wrapper.text()).toContain('Test Field')
    expect(wrapper.text()).toContain('12.5 hectares')
  })

  it('should display current crop', () => {
    const wrapper = mount(FieldCard, {
      props: {
        field: mockField
      }
    })

    expect(wrapper.text()).toContain('Wheat')
  })

  it('should hide edit button when readonly', () => {
    const wrapper = mount(FieldCard, {
      props: {
        field: mockField,
        readonly: true
      }
    })

    const editButton = wrapper.find('button')
    expect(editButton.exists()).toBe(false)
  })

  it('should show edit button when not readonly', () => {
    const wrapper = mount(FieldCard, {
      props: {
        field: mockField,
        readonly: false
      }
    })

    const editButton = wrapper.find('button')
    expect(editButton.exists()).toBe(true)
    expect(editButton.text()).toBe('Edit')
  })
})
