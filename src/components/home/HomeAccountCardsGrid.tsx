import React, { useMemo } from 'react'
import { FlatList } from 'react-native'
import AccountShell from '../../common/data/models/AccountShell'
import AccountCardColumn from './AccountCardColumn'

export type Props = {
  accountShells: AccountShell[];
  onCardLongPressed: ( accountShell: AccountShell ) => void;
  onAccountSelected: ( accountShell: AccountShell ) => void;
  onAddNewSelected: () => void;
  contentContainerStyle?: Record<string, unknown>;
};

type RenderItemProps = {
  item: AccountShell[];
  index: number;
};


function keyExtractor( item: AccountShell[] ): string {
  return item[ 0 ].id
}

const HomeAccountCardsGrid: React.FC<Props> = ( {
  accountShells,
  onCardLongPressed,
  onAccountSelected,
  onAddNewSelected,
  contentContainerStyle = {
  },
}: Props ) => {

  const columnData: Array<AccountShell[]> = useMemo( () => {
    if ( accountShells.length == 0 ) {
      return []
    }

    if ( accountShells.length == 1 ) {
      return [ accountShells ]
    }

    ///////////////////
    // Even though we're rendering the list as horizontally scrolling set of
    // 2-row columns, we want the appearance to be such that every group of four
    // is ordered row-wise. The logic below is for formatting the data in such
    // away that this will happen. (See: https://github.com/bithyve/hexa/issues/2250)
    ///////////////////

    const evenIndexedShells = Array.from( accountShells ).reduce( ( accumulated, current, index ) => {
      if ( index % 2 == 0 ) {
        accumulated.push( current )
      }

      return accumulated
    }, [] )

    const oddIndexedShells = Array.from( accountShells ).reduce( ( accumulated, current, index ) => {
      if ( index % 2 == 1 ) {
        accumulated.push( current )
      }

      return accumulated
    }, [] )

    const sortedShells: AccountShell[] = []
    let isChoosingEvenIndexedShells = true
    let isFirstShell = true

    while ( evenIndexedShells.length > 0 || oddIndexedShells.length > 0 ) {
      if ( isFirstShell ) {
        sortedShells.push( ...oddIndexedShells.splice( 0, 1 ) )
        isFirstShell = false
      } else {
        if ( isChoosingEvenIndexedShells ) {
          sortedShells.push( ...evenIndexedShells.splice( 0, 2 ) )
        } else {
          sortedShells.push( ...oddIndexedShells.splice( 0, 2 ) )
        }
        isChoosingEvenIndexedShells = !isChoosingEvenIndexedShells
      }
    }

    const shellCount = sortedShells.length
    const columns = []
    let currentColumn = []

    sortedShells.forEach( ( accountShell, index ) => {
      currentColumn.push( accountShell )

      // Make a new column after adding two items -- or after adding the
      // very first item. This is because the first column
      // will only contain one item, since the "Add new" button will be placed
      // in front of everything.
      if ( currentColumn.length == 2 || index == 0 ) {
        columns.push( currentColumn )
        currentColumn = []
      }

      // If we're at the end and a partially filled column still exists,
      // push it.
      if ( index == shellCount - 1 && currentColumn.length > 0 ) {
        columns.push( currentColumn )
      }
    } )

    return columns
  }, [ accountShells ] )

  return (
    <FlatList
      horizontal
      contentContainerStyle={contentContainerStyle}
      showsHorizontalScrollIndicator={false}
      data={columnData}
      keyExtractor={keyExtractor}
      renderItem={( { item, index }: RenderItemProps ) => {
        return <AccountCardColumn
          cardData={item}
          prependsAddButton={index == 0}
          onAccountCardSelected={onAccountSelected}
          onAddNewAccountPressed={onAddNewSelected}
          onCardLongPressed={onCardLongPressed}
        />
      }}
    />
  )
}


export default HomeAccountCardsGrid
