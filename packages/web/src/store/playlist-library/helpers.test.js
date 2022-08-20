import {
  addFolderToLibrary,
  containsTempContentList,
  findIndexInContentListLibrary,
  findInContentListLibrary,
  removeFromContentListLibrary,
  removeContentListFolderInLibrary,
  removeContentListLibraryDuplicates,
  renameContentListFolderInLibrary,
  reorderContentListLibrary,
  addContentListToFolder,
  extractTempContentListsFromLibrary,
  replaceTempWithResolvedContentLists,
  removeContentListLibraryTempContentLists,
  getContentListsNotInLibrary
} from 'common/store/content list-library/helpers'

describe('findInContentListLibrary', () => {
  it('finds an index in the library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const found = findInContentListLibrary(library, 2)
    expect(found).toEqual({ type: 'content list', content list_id: 2 })
  })

  it('finds an index in the library with folders', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          contents: [{ type: 'content list', content list_id: 3 }]
        },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const found = findInContentListLibrary(library, 3)
    expect(found).toEqual({ type: 'content list', content list_id: 3 })
  })

  it('does not find something not in the library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'fake-uuid',
          contents: [{ type: 'content list', content list_id: 3 }]
        },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const found = findInContentListLibrary(library, 10)
    expect(found).toEqual(false)
  })
})

describe('findIndexInContentListLibrary', () => {
  it('finds an index in the library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const index = findIndexInContentListLibrary(library, 2)
    expect(index).toEqual(1)
  })

  it('does not find something not in the library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const index = findIndexInContentListLibrary(library, 10)
    expect(index).toEqual(-1)
  })

  it('finds folder in the library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'fake-uuid',
          contents: [
            { type: 'content list', content list_id: 7 },
            { type: 'content list', content list_id: 10 }
          ]
        }
      ]
    }
    const index = findIndexInContentListLibrary(library, 'fake-uuid')
    expect(index).toEqual(4)
  })

  it('finds content list inside folder', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'fake-uuid',
          contents: [
            { type: 'content list', content list_id: 7 },
            { type: 'content list', content list_id: 10 },
            { type: 'temp_content list', content list_id: '33' },
            {
              type: 'folder',
              name: 'favorites 2',
              id: 'fake-uuid-2',
              contents: [
                { type: 'content list', content list_id: 11 },
                { type: 'content list', content list_id: 12 },
                { type: 'temp_content list', content list_id: 13 }
              ]
            }
          ]
        }
      ]
    }
    let index = findIndexInContentListLibrary(library, 7)
    expect(index).toEqual([4, 0])

    index = findIndexInContentListLibrary(library, '33')
    expect(index).toEqual([4, 2])

    index = findIndexInContentListLibrary(library, 12)
    expect(index).toEqual([4, 3, 1])
  })

  it('finds folder inside folder', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'fake-uuid',
          contents: [
            { type: 'content list', content list_id: 7 },
            { type: 'content list', content list_id: 10 },
            { type: 'temp_content list', content list_id: '33' },
            {
              type: 'folder',
              name: 'favorites 2',
              id: 'fake-uuid-2',
              contents: [
                { type: 'content list', content list_id: 11 },
                { type: 'content list', content list_id: 12 },
                { type: 'temp_content list', content list_id: 13 }
              ]
            }
          ]
        }
      ]
    }
    const index = findIndexInContentListLibrary(library, 'fake-uuid-2')
    expect(index).toEqual([4, 3])
  })
})

describe('removeFromContentListLibrary', () => {
  it('removes content list from the library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const { library: ret, removed } = removeFromContentListLibrary(library, 2)
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    })
    expect(removed).toEqual({ type: 'content list', content list_id: 2 })
  })

  it('removes folder from the library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 },
        {
          type: 'folder',
          contents: [{ type: 'content list', content list_id: 5 }],
          id: 'fake-uuid',
          name: 'Foldar'
        }
      ]
    }
    const { library: ret, removed } = removeFromContentListLibrary(
      library,
      'fake-uuid'
    )
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    })
    expect(removed).toEqual({
      type: 'folder',
      contents: [{ type: 'content list', content list_id: 5 }],
      id: 'fake-uuid',
      name: 'Foldar'
    })
  })

  it('removes content list from the library with folders present', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          contents: [
            { type: 'content list', content list_id: 3 },
            { type: 'content list', content list_id: 5 }
          ]
        },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const { library: ret, removed } = removeFromContentListLibrary(library, 3)
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          contents: [{ type: 'content list', content list_id: 5 }]
        },
        { type: 'content list', content list_id: 4 }
      ]
    })
    expect(removed).toEqual({ type: 'content list', content list_id: 3 })
  })

  it('does not remove something not in the library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          contents: [
            { type: 'content list', content list_id: 3 },
            { type: 'content list', content list_id: 5 }
          ]
        },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const { library: ret, removed } = removeFromContentListLibrary(library, 100)
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          contents: [
            { type: 'content list', content list_id: 3 },
            { type: 'content list', content list_id: 5 }
          ]
        },
        { type: 'content list', content list_id: 4 }
      ]
    })
    expect(removed).toEqual(null)
  })
})

describe('removeContentListLibraryDuplicates', () => {
  it('can remove single dupes', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 1 }
      ]
    }
    const ret = removeContentListLibraryDuplicates(library)
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 }
      ]
    })
  })

  it('does not remove non duplicates', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 },
        { type: 'content list', content list_id: 5 },
        { type: 'content list', content list_id: 6 }
      ]
    }
    const ret = removeContentListLibraryDuplicates(library)
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 },
        { type: 'content list', content list_id: 5 },
        { type: 'content list', content list_id: 6 }
      ]
    })
  })

  it('can remove multiple dupes', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 3 }
      ]
    }
    const ret = removeContentListLibraryDuplicates(library)
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 }
      ]
    })
  })

  it('can remove nested dupes', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        {
          type: 'folder',
          name: 'favorites',
          contents: [
            { type: 'content list', content list_id: 2 },
            { type: 'content list', content list_id: 3 },
            { type: 'content list', content list_id: 5 }
          ]
        },
        { type: 'content list', content list_id: 3 }
      ]
    }
    const ret = removeContentListLibraryDuplicates(library)
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        {
          type: 'folder',
          name: 'favorites',
          contents: [{ type: 'content list', content list_id: 5 }]
        }
      ]
    })
  })

  it('can remove dupe folders', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'content list', content list_id: 4 },
            { type: 'content list', content list_id: 5 },
            { type: 'content list', content list_id: 6 }
          ]
        },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'content list', content list_id: 4 },
            { type: 'content list', content list_id: 5 },
            { type: 'content list', content list_id: 6 }
          ]
        },
        {
          type: 'folder',
          name: 'favorites',
          id: 'different-uuid',
          contents: [
            { type: 'content list', content list_id: 4 },
            { type: 'content list', content list_id: 5 },
            { type: 'content list', content list_id: 6 }
          ]
        }
      ]
    }
    const result = removeContentListLibraryDuplicates(library)

    const expectedResult = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'content list', content list_id: 4 },
            { type: 'content list', content list_id: 5 },
            { type: 'content list', content list_id: 6 }
          ]
        },
        {
          type: 'folder',
          name: 'favorites',
          id: 'different-uuid',
          contents: []
        }
      ]
    }
    expect(result).toEqual(expectedResult)
  })
})

describe('removeContentListLibraryTempContentLists', () => {
  it('can remove temporary content lists', () => {
    const library = {
      contents: [
        { type: 'temp_content list', content list_id: '33' },
        { type: 'explore_content list', content list_id: 'Heavy Rotation' },
        {
          type: 'folder',
          name: 'My folder',
          id: 'uuid',
          contents: [
            { type: 'temp_content list', content list_id: '44' },
            { type: 'content list', content list_id: 5 },
            { type: 'content list', content list_id: 6 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 1 }
      ]
    }
    const ret = removeContentListLibraryTempContentLists(library)
    expect(ret).toEqual({
      contents: [
        { type: 'explore_content list', content list_id: 'Heavy Rotation' },
        {
          type: 'folder',
          name: 'My folder',
          id: 'uuid',
          contents: [
            { type: 'content list', content list_id: 5 },
            { type: 'content list', content list_id: 6 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 1 }
      ]
    })
  })

  it('does not remove non temp content lists', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'explore_content list', content list_id: 'Heavy Rotation' },
        {
          type: 'folder',
          name: 'My folder',
          id: 'uuid',
          contents: [
            { type: 'content list', content list_id: 10 },
            { type: 'content list', content list_id: 11 }
          ]
        },
        { type: 'content list', content list_id: 4 },
        { type: 'content list', content list_id: 5 },
        { type: 'content list', content list_id: 6 }
      ]
    }
    const ret = removeContentListLibraryTempContentLists(library)
    expect(ret).toEqual(library)
  })

  it('can deal with empty library', () => {
    const library = {
      contents: []
    }
    let ret = removeContentListLibraryTempContentLists(library)
    expect(ret).toEqual(library)

    library.contents = null
    ret = removeContentListLibraryTempContentLists(library)
    expect(ret).toEqual(library)
  })
})

describe('reorderContentListLibrary', () => {
  it('can reorder adjacent content lists', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const ret = reorderContentListLibrary(library, 2, 3)
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 4 }
      ]
    })
  })

  it('can reorder the start content list', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        }
      ]
    }
    const ret = reorderContentListLibrary(library, 1, 4)
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 },
        { type: 'content list', content list_id: 1 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        }
      ]
    })
  })

  it('can reorder the end content list', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const ret = reorderContentListLibrary(library, 4, 1)
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 4 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 3 }
      ]
    })
  })

  it('can reorder a content list inside a folder', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const ret = reorderContentListLibrary(library, '10', 2)
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'temp_content list', content list_id: '10' },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    })
  })

  it('can reorder a content list to the beginning', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const ret = reorderContentListLibrary(library, 3, -1)
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 4 }
      ]
    })
  })

  it('can reorder a content list to a folder', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        {
          type: 'folder',
          name: 'favorites 2',
          id: 'my-uuid-2',
          contents: [
            { type: 'temp_content list', content list_id: '100' },
            { type: 'explore_content list', content list_id: 'Best New Releases' },
            { type: 'content list', content list_id: 120 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const ret = reorderContentListLibrary(library, 3, -1)
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        {
          type: 'folder',
          name: 'favorites 2',
          id: 'my-uuid-2',
          contents: [
            { type: 'temp_content list', content list_id: '100' },
            { type: 'explore_content list', content list_id: 'Best New Releases' },
            { type: 'content list', content list_id: 120 }
          ]
        },
        { type: 'content list', content list_id: 4 }
      ]
    })

    const ret2 = reorderContentListLibrary(ret, '100', '10')
    expect(ret2).toEqual({
      contents: [
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'temp_content list', content list_id: '100' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        {
          type: 'folder',
          name: 'favorites 2',
          id: 'my-uuid-2',
          contents: [
            { type: 'explore_content list', content list_id: 'Best New Releases' },
            { type: 'content list', content list_id: 120 }
          ]
        },
        { type: 'content list', content list_id: 4 }
      ]
    })
  })

  it('can reorder a content list inside a folder to another position inside the folder', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const ret = reorderContentListLibrary(library, 'Heavy Rotation', 12)
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'content list', content list_id: 12 },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    })
  })

  it('does not reorder a content list to a location outside of the library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const ret = reorderContentListLibrary(library, 3, 10)
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 4 }
      ]
    })
  })

  it('inserts a new content list that was not in the original order', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const ret = reorderContentListLibrary(library, 5, 2)
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 5 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    })
    const res2 = reorderContentListLibrary(library, 22, 'Heavy Rotation')
    expect(res2).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 22 },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    })
  })

  it('soft fails if the dragging item is a folder but it is not in the library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const ret = reorderContentListLibrary(
      library,
      'not-exist-folder',
      2,
      'content list-folder'
    )
    expect(ret).toEqual(library)
  })

  it('is a no op if the dragging id and dropping id are the same', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const ret = reorderContentListLibrary(
      library,
      'my-uuid',
      'my-uuid',
      'content list-folder'
    )
    expect(ret).toEqual(library)
  })

  it('can reorder a folder to the beginning of the library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const ret = reorderContentListLibrary(
      library,
      'my-uuid',
      -1,
      'content list-folder'
    )
    expect(ret).toEqual({
      contents: [
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    })
  })

  it('can reorder a folder to the end of the library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const ret = reorderContentListLibrary(library, 'my-uuid', 4, 'content list-folder')
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        }
      ]
    })
  })

  it('can reorder a folder to the middle of the library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const ret = reorderContentListLibrary(library, 'my-uuid', 3, 'content list-folder')
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 4 }
      ]
    })
  })

  it('can reorder a content list or folder after a folder', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        {
          type: 'folder',
          name: 'favorites 2',
          id: 'my-uuid-2',
          contents: [
            { type: 'explore_content list', content list_id: 'Best New Releases' },
            { type: 'content list', content list_id: 120 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const ret = reorderContentListLibrary(
      library,
      'my-uuid',
      'my-uuid-2',
      'content list-folder'
    )
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites 2',
          id: 'my-uuid-2',
          contents: [
            { type: 'explore_content list', content list_id: 'Best New Releases' },
            { type: 'content list', content list_id: 120 }
          ]
        },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    })
    const ret2 = reorderContentListLibrary(ret, 2, 'my-uuid', 'content list')
    expect(ret2).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        {
          type: 'folder',
          name: 'favorites 2',
          id: 'my-uuid-2',
          contents: [
            { type: 'explore_content list', content list_id: 'Best New Releases' },
            { type: 'content list', content list_id: 120 }
          ]
        },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    })
  })

  it('can reorder an item before the target item', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        {
          type: 'folder',
          name: 'favorites 2',
          id: 'my-uuid-2',
          contents: [
            { type: 'explore_content list', content list_id: 'Best New Releases' },
            { type: 'content list', content list_id: 120 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const ret = reorderContentListLibrary(
      library,
      'my-uuid',
      1,
      'content list-folder',
      true
    )
    expect(ret).toEqual({
      contents: [
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites 2',
          id: 'my-uuid-2',
          contents: [
            { type: 'explore_content list', content list_id: 'Best New Releases' },
            { type: 'content list', content list_id: 120 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    })
    const ret2 = reorderContentListLibrary(ret, 1, '10', 'content list', true)
    expect(ret2).toEqual({
      contents: [
        {
          type: 'folder',
          name: 'favorites',
          id: 'my-uuid',
          contents: [
            { type: 'content list', content list_id: 1 },
            { type: 'temp_content list', content list_id: '10' },
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 12 }
          ]
        },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites 2',
          id: 'my-uuid-2',
          contents: [
            { type: 'explore_content list', content list_id: 'Best New Releases' },
            { type: 'content list', content list_id: 120 }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'content list', content list_id: 4 }
      ]
    })
  })
})

describe('containsTempContentList', () => {
  it('finds a temp', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'temp_content list', content list_id: 'asdf' }
      ]
    }
    const ret = containsTempContentList(library)
    expect(ret).toEqual(true)
  })

  it('finds a temp in a folder', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          contents: [
            { type: 'content list', content list_id: 3 },
            { type: 'temp_content list', content list_id: 'asdf' }
          ]
        },
        { type: 'content list', content list_id: 4 }
      ]
    }
    const ret = containsTempContentList(library)
    expect(ret).toEqual(true)
  })

  it('finds no temp', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 }
      ]
    }
    const ret = containsTempContentList(library)
    expect(ret).toEqual(false)
  })
})

describe('addFolderToLibrary', () => {
  it('Adds a new folder to the end of a content list library and returns the result', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'temp_content list', content list_id: 'asdf' }
      ]
    }
    const folder = {
      id: 'fake-uuid',
      name: 'Foldero',
      contents: [],
      type: 'folder'
    }
    const result = addFolderToLibrary(library, folder)
    const expectedResult = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'temp_content list', content list_id: 'asdf' },
        {
          id: 'fake-uuid',
          name: 'Foldero',
          contents: [],
          type: 'folder'
        }
      ]
    }
    expect(result).toEqual(expectedResult)
  })

  it('works with a null library', () => {
    const library = null
    const folder = {
      id: 'fake-uuid',
      name: 'Foldero',
      contents: [],
      type: 'folder'
    }
    const result = addFolderToLibrary(library, folder)
    const expectedResult = {
      contents: [
        {
          id: 'fake-uuid',
          name: 'Foldero',
          contents: [],
          type: 'folder'
        }
      ]
    }
    expect(result).toEqual(expectedResult)
  })

  it('works with an empty library', () => {
    const emptyLibrary1 = {
      contents: []
    }
    const folder = {
      id: 'fake-uuid',
      name: 'Foldero',
      contents: [],
      type: 'folder'
    }
    const result1 = addFolderToLibrary(emptyLibrary1, folder)
    const expectedResult1 = {
      contents: [
        {
          id: 'fake-uuid',
          name: 'Foldero',
          contents: [],
          type: 'folder'
        }
      ]
    }
    expect(result1).toEqual(expectedResult1)

    const emptyLibrary2 = null
    const result2 = addFolderToLibrary(emptyLibrary2, folder)
    const expectedResult2 = {
      contents: [
        {
          id: 'fake-uuid',
          name: 'Foldero',
          contents: [],
          type: 'folder'
        }
      ]
    }
    expect(result2).toEqual(expectedResult2)
  })
})

describe('renameContentListFolderInLibrary', () => {
  it('changes the name of given folder in library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'folder', name: 'Foldero', id: 'fake-uuid', contents: [] },
        { type: 'content list', content list_id: 3 },
        { type: 'temp_content list', content list_id: 'asdf' }
      ]
    }

    const result = renameContentListFolderInLibrary(
      library,
      'fake-uuid',
      'Foldera'
    )
    const expectedResult = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          id: 'fake-uuid',
          name: 'Foldera',
          contents: [],
          type: 'folder'
        },
        { type: 'content list', content list_id: 3 },
        { type: 'temp_content list', content list_id: 'asdf' }
      ]
    }
    expect(result).toEqual(expectedResult)
  })

  it('is a no op if the given folder is not in the library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'folder', name: 'Foldero', id: 'fake-uuid', contents: [] },
        { type: 'content list', content list_id: 3 },
        { type: 'temp_content list', content list_id: 'asdf' }
      ]
    }
    const result = renameContentListFolderInLibrary(
      library,
      'fake-uuid-not-in-library',
      'new name'
    )
    expect(result).toEqual({ ...library })
  })
})

describe('removeContentListFolderInLibrary', () => {
  it('removes folder from library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'folder', name: 'Foldero', id: 'fake-uuid', contents: [] },
        { type: 'content list', content list_id: 3 },
        { type: 'temp_content list', content list_id: 'asdf' }
      ]
    }

    const result = removeContentListFolderInLibrary(library, 'fake-uuid')
    const expectedResult = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 3 },
        { type: 'temp_content list', content list_id: 'asdf' }
      ]
    }
    expect(result).toEqual(expectedResult)
  })

  it('moves contents of folder to upper level before deleting', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'Foldero',
          id: 'fake-uuid',
          contents: [
            { type: 'content list', content list_id: 4 },
            { type: 'content list', content list_id: 5 },
            { type: 'temp_content list', content list_id: 'ghji' },
            {
              type: 'folder',
              name: 'Folderino',
              id: 'fake-uuid-2',
              contents: []
            }
          ]
        },
        { type: 'content list', content list_id: 3 },
        { type: 'temp_content list', content list_id: 'asdf' }
      ]
    }
    const result = removeContentListFolderInLibrary(library, 'fake-uuid')
    const expectedResult = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'content list', content list_id: 4 },
        { type: 'content list', content list_id: 5 },
        { type: 'temp_content list', content list_id: 'ghji' },
        { type: 'folder', name: 'Folderino', id: 'fake-uuid-2', contents: [] },
        { type: 'content list', content list_id: 3 },
        { type: 'temp_content list', content list_id: 'asdf' }
      ]
    }
    expect(result).toEqual(expectedResult)
  })

  it('is a no op if the given folder is not in the library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'folder', name: 'Foldero', id: 'fake-uuid', contents: [] },
        { type: 'content list', content list_id: 3 },
        { type: 'temp_content list', content list_id: 'asdf' }
      ]
    }
    const result = removeContentListFolderInLibrary(
      library,
      'fake-uuid-not-in-library'
    )
    expect(result).toEqual({ ...library })
  })
})

describe('addContentListToFolder', () => {
  it('adds content list to given folder', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'Foldero',
          id: 'fake-uuid',
          contents: [
            { type: 'content list', content list_id: 3 },
            { type: 'temp_content list', content list_id: 'asdf' }
          ]
        }
      ]
    }

    const result = addContentListToFolder(library, 'Heavy Rotation', 'fake-uuid')
    const expectedResult = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'Foldero',
          id: 'fake-uuid',
          contents: [
            { type: 'explore_content list', content list_id: 'Heavy Rotation' },
            { type: 'content list', content list_id: 3 },
            { type: 'temp_content list', content list_id: 'asdf' }
          ]
        }
      ]
    }
    expect(result).toEqual(expectedResult)
  })

  it('returns the original unchanged library if the content list is already in the folder', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'Foldero',
          id: 'fake-uuid',
          contents: [
            { type: 'content list', content list_id: 3 },
            { type: 'temp_content list', content list_id: 'asdf' }
          ]
        }
      ]
    }

    const result = addContentListToFolder(library, 'asdf', 'fake-uuid')
    expect(result).toBe(library)
  })

  it('returns the original unchanged library if folder does not exist', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'Foldero',
          id: 'fake-uuid',
          contents: [
            { type: 'content list', content list_id: 3 },
            { type: 'temp_content list', content list_id: 'asdf' }
          ]
        }
      ]
    }

    const result = addContentListToFolder(
      library,
      'Heavy Rotation',
      'uuid-doesnt-exist'
    )
    expect(result).toBe(library)
  })

  it('returns the original unchanged library if the library has no contents', () => {
    const library = {}

    const result = addContentListToFolder(library, 'Heavy Rotation', 'fake-uuid')
    expect(result).toBe(library)
  })

  it('moves the content list into the folder if the content list is already in the library but not in the folder', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        {
          type: 'folder',
          name: 'Foldero',
          id: 'fake-uuid',
          contents: [
            { type: 'content list', content list_id: 3 },
            { type: 'temp_content list', content list_id: 'asdf' }
          ]
        }
      ]
    }

    const result = addContentListToFolder(library, 2, 'fake-uuid')
    const expectedResult = {
      contents: [
        { type: 'content list', content list_id: 1 },
        {
          type: 'folder',
          name: 'Foldero',
          id: 'fake-uuid',
          contents: [
            { type: 'content list', content list_id: 2 },
            { type: 'content list', content list_id: 3 },
            { type: 'temp_content list', content list_id: 'asdf' }
          ]
        }
      ]
    }
    expect(result).toEqual(expectedResult)
  })
})

describe('extractTempContentListsFromLibrary', () => {
  it('returns all temp content lists in library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'explore_content list', content list_id: 'Heavy Rotation' },
        { type: 'temp_content list', content list_id: 'e' },
        {
          type: 'folder',
          id: 'my id',
          name: 'Favorites',
          contents: [
            { type: 'content list', content list_id: 10 },
            { type: 'temp_content list', content list_id: 'a' },
            { type: 'temp_content list', content list_id: 'b' },
            { type: 'content list', content list_id: 11 },
            { type: 'temp_content list', content list_id: 'c' },
            { type: 'temp_content list', content list_id: 'd' }
          ]
        }
      ]
    }
    const ret = extractTempContentListsFromLibrary(library)
    expect(ret).toEqual([
      { type: 'temp_content list', content list_id: 'e' },
      { type: 'temp_content list', content list_id: 'a' },
      { type: 'temp_content list', content list_id: 'b' },
      { type: 'temp_content list', content list_id: 'c' },
      { type: 'temp_content list', content list_id: 'd' }
    ])
  })

  it('can deal with empty libraries', () => {
    const ret = extractTempContentListsFromLibrary({
      contents: []
    })
    expect(ret).toEqual([])

    const ret2 = extractTempContentListsFromLibrary({})
    expect(ret2).toEqual([])
  })

  it('returns empty array if no temp content lists in library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'explore_content list', content list_id: 'Heavy Rotation' },
        {
          type: 'folder',
          id: 'my id',
          name: 'Favorites',
          contents: [
            { type: 'content list', content list_id: 10 },
            { type: 'content list', content list_id: 11 }
          ]
        }
      ]
    }
    const ret = extractTempContentListsFromLibrary(library)
    expect(ret).toEqual([])
  })
})

describe('replaceTempWithResolvedContentLists', () => {
  it('returns all temp content lists in library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'explore_content list', content list_id: 'Heavy Rotation' },
        { type: 'temp_content list', content list_id: 'e' },
        {
          type: 'folder',
          id: 'my id',
          name: 'Favorites',
          contents: [
            { type: 'content list', content list_id: 10 },
            { type: 'temp_content list', content list_id: 'a' },
            { type: 'temp_content list', content list_id: 'b' },
            { type: 'content list', content list_id: 11 },
            { type: 'temp_content list', content list_id: 'c' },
            { type: 'temp_content list', content list_id: 'd' }
          ]
        }
      ]
    }
    const tempContentListIdToResolvedContentList = {
      e: { type: 'content list', content list_id: 12 },
      a: { type: 'content list', content list_id: 13 },
      b: { type: 'content list', content list_id: 14 },
      c: { type: 'content list', content list_id: 15 },
      d: { type: 'content list', content list_id: 16 }
    }

    const ret = replaceTempWithResolvedContentLists(
      library,
      tempContentListIdToResolvedContentList
    )
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'explore_content list', content list_id: 'Heavy Rotation' },
        { type: 'content list', content list_id: 12 },
        {
          type: 'folder',
          id: 'my id',
          name: 'Favorites',
          contents: [
            { type: 'content list', content list_id: 10 },
            { type: 'content list', content list_id: 13 },
            { type: 'content list', content list_id: 14 },
            { type: 'content list', content list_id: 11 },
            { type: 'content list', content list_id: 15 },
            { type: 'content list', content list_id: 16 }
          ]
        }
      ]
    })
  })

  it('can deal with empty libraries', () => {
    const ret = replaceTempWithResolvedContentLists(
      {
        contents: []
      },
      {}
    )
    expect(ret).toEqual({
      contents: []
    })

    const ret2 = replaceTempWithResolvedContentLists({})
    expect(ret2).toEqual({})
  })

  it('can deal with empty folders', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'explore_content list', content list_id: 'Heavy Rotation' },
        { type: 'temp_content list', content list_id: 'e' },
        {
          type: 'folder',
          id: 'my id',
          name: 'Favorites',
          contents: [
            { type: 'content list', content list_id: 10 },
            { type: 'temp_content list', content list_id: 'a' },
            { type: 'temp_content list', content list_id: 'b' },
            { type: 'content list', content list_id: 11 },
            { type: 'temp_content list', content list_id: 'c' },
            { type: 'temp_content list', content list_id: 'd' }
          ]
        },
        { type: 'folder', id: 'my id 2', name: 'Favorites 2', contents: [] }
      ]
    }
    const tempContentListIdToResolvedContentList = {
      e: { type: 'content list', content list_id: 12 },
      a: { type: 'content list', content list_id: 13 },
      b: { type: 'content list', content list_id: 14 },
      c: { type: 'content list', content list_id: 15 },
      d: { type: 'content list', content list_id: 16 }
    }

    const ret = replaceTempWithResolvedContentLists(
      library,
      tempContentListIdToResolvedContentList
    )
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'explore_content list', content list_id: 'Heavy Rotation' },
        { type: 'content list', content list_id: 12 },
        {
          type: 'folder',
          id: 'my id',
          name: 'Favorites',
          contents: [
            { type: 'content list', content list_id: 10 },
            { type: 'content list', content list_id: 13 },
            { type: 'content list', content list_id: 14 },
            { type: 'content list', content list_id: 11 },
            { type: 'content list', content list_id: 15 },
            { type: 'content list', content list_id: 16 }
          ]
        },
        { type: 'folder', id: 'my id 2', name: 'Favorites 2', contents: [] }
      ]
    })
  })

  it('can deal with missing temp content list mapping', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'explore_content list', content list_id: 'Heavy Rotation' },
        { type: 'temp_content list', content list_id: 'e' },
        {
          type: 'folder',
          id: 'my id',
          name: 'Favorites',
          contents: [
            { type: 'content list', content list_id: 10 },
            { type: 'temp_content list', content list_id: 'a' },
            { type: 'temp_content list', content list_id: 'b' },
            { type: 'content list', content list_id: 11 },
            { type: 'temp_content list', content list_id: 'c' },
            { type: 'temp_content list', content list_id: 'd' }
          ]
        }
      ]
    }
    const tempContentListIdToResolvedContentList = {
      e: { type: 'content list', content list_id: 12 },
      b: { type: 'content list', content list_id: 14 },
      c: { type: 'content list', content list_id: 15 },
      d: { type: 'content list', content list_id: 16 }
    }

    const ret = replaceTempWithResolvedContentLists(
      library,
      tempContentListIdToResolvedContentList
    )
    expect(ret).toEqual({
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'explore_content list', content list_id: 'Heavy Rotation' },
        { type: 'content list', content list_id: 12 },
        {
          type: 'folder',
          id: 'my id',
          name: 'Favorites',
          contents: [
            { type: 'content list', content list_id: 10 },
            { type: 'temp_content list', content list_id: 'a' },
            { type: 'content list', content list_id: 14 },
            { type: 'content list', content list_id: 11 },
            { type: 'content list', content list_id: 15 },
            { type: 'content list', content list_id: 16 }
          ]
        }
      ]
    })
  })
})

describe('getContentListsNotInLibrary', () => {
  it('returns the content lists that are not already in the library', () => {
    const library = {
      contents: [
        { type: 'content list', content list_id: 1 },
        { type: 'content list', content list_id: 2 },
        { type: 'explore_content list', content list_id: 'Heavy Rotation' },
        { type: 'temp_content list', content list_id: 'e' },
        {
          type: 'folder',
          id: 'my id',
          name: 'Favorites',
          contents: [
            { type: 'content list', content list_id: 10 },
            { type: 'content list', content list_id: 11 },
            { type: 'temp_content list', content list_id: 'd' }
          ]
        }
      ]
    }
    const content lists = {
      1: {
        id: 1,
        is_album: false,
        name: 'test',
        user: {
          handle: 'nikki',
          id: 49408
        }
      },
      2: {
        id: 2,
        is_album: false,
        name: 'test',
        user: {
          handle: 'nikki',
          id: 49408
        }
      },
      10: {
        id: 10,
        is_album: false,
        name: 'ten',
        user: {
          handle: 'nikki',
          id: 49408
        }
      },
      11: {
        id: 11,
        is_album: false,
        name: 'eleven',
        user: {
          handle: 'nikki',
          id: 49408
        }
      },
      12: {
        id: 12,
        is_album: false,
        name: 'twelve',
        user: {
          handle: 'nikki',
          id: 49408
        }
      }
    }

    const ret = getContentListsNotInLibrary(library, content lists)
    expect(ret).toEqual({
      12: {
        id: 12,
        is_album: false,
        name: 'twelve',
        user: {
          handle: 'nikki',
          id: 49408
        }
      }
    })
  })
})
