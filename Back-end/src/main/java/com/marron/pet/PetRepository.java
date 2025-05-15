package com.marron.pet;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface PetRepository extends JpaRepository<Pet, Integer> {
    List<Pet> findByNameOrSpeciesOrBreedOrGenderOrImageOrDescription(String name, String species, String breed, String gender, String image, String description);

    List<Pet> findByPrice(Double price);

    List<Pet> findByPriceLessThanEqual(Double price);
}