import { describe, it, expect } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import AttributionPanel from '../../components/AttributionPanel'

describe('AttributionPanel', () => {
  it('renders rows and reasons', () => {
    const { getByText } = render(<AttributionPanel contributions={[{key:'SMC_ZQS',value:0.66}]} reasons={['out_of_session']} />)
    expect(getByText('SMC_ZQS')).toBeTruthy()
    expect(getByText('out_of_session')).toBeTruthy()
  })
})
